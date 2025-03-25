import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, isAuthenticated } from "./auth";
import { storage, mysteryBoxTypes } from "./storage";
import { z } from "zod";
import { dailySpinRewards, superJackpotRewards } from "@shared/schema";
import { nowPaymentsService, PaymentStatusResponse, StandardizedPaymentStatus, isNOWPaymentsConfigured, isIPNSecretConfigured } from "./nowpayments";
import { config } from "./config";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Health endpoint for monitoring
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });
  
  // Public test endpoints for payment testing - No authentication required
  app.get("/api/public/payments/service-status", async (req, res) => {
    try {
      const apiConfigured = isNOWPaymentsConfigured();
      const ipnConfigured = isIPNSecretConfigured();
      let serviceStatus = "unknown";
      
      if (apiConfigured) {
        try {
          const statusResponse = await nowPaymentsService.getStatus();
          serviceStatus = statusResponse.status;
        } catch (err) {
          serviceStatus = "error";
          console.error("Error checking NOWPayments service status:", err);
        }
      }
      
      res.json({
        apiConfigured,
        ipnConfigured,
        serviceStatus,
        timeStamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error in service status endpoint:", error);
      res.status(500).json({ error: "Failed to check payment service status" });
    }
  });
  
  app.post("/api/public/payments/test-invoice", async (req, res) => {
    try {
      if (!isNOWPaymentsConfigured()) {
        return res.status(400).json({ 
          success: false, 
          error: "NOWPayments API is not configured" 
        });
      }
      
      // Get amount from request body or use default
      const amount = req.body && typeof req.body.amount === 'number' ? req.body.amount : 5.00;
      const currency = req.body && typeof req.body.currency === 'string' ? req.body.currency : 'USD';
      const testUserId = 99999; // Use a test user ID
      
      // Generate success and cancel URLs
      const successUrl = `${config.urls.app}/payment-test?status=success`;
      const cancelUrl = `${config.urls.app}/payment-test?status=cancelled`;
      
      // Set up callback URL for NOWPayments IPN webhook
      const callbackUrl = `${config.urls.api}/api/payments/callback`;
      
      console.log(`[TEST] Creating NOWPayments test invoice, amount: ${amount} ${currency}`);
      
      // Create the invoice using NOWPayments API
      const invoice = await nowPaymentsService.createInvoice(
        amount,
        testUserId,
        currency,
        successUrl,
        cancelUrl,
        "test-order-" + Date.now(), // Generate a unique test order ID
        `ChickFarms Test Payment - ${amount} ${currency}`,
        callbackUrl
      );
      
      console.log(`[TEST] Created test invoice with ID ${invoice.id}, popup URL: ${invoice.invoice_url}`);
      
      // Return the NOWPayments invoice URL to open in a popup/iframe
      res.json({
        success: true,
        invoiceId: invoice.id,
        invoiceUrl: invoice.invoice_url
      });
    } catch (error) {
      console.error("[TEST] Error creating test NOWPayments invoice:", error);
      res.status(500).json({ 
        success: false,
        error: "Failed to create test payment invoice",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // NOWPayments API endpoints
  app.get("/api/payments/status", async (req, res) => {
    try {
      const status = await nowPaymentsService.getStatus();
      res.json({ 
        status, 
        apiKeyConfigured: isNOWPaymentsConfigured(),
        ipnSecretConfigured: isIPNSecretConfigured()
      });
    } catch (error) {
      console.error("Error checking NOWPayments status:", error);
      res.status(500).json({ error: "Failed to check payment service status" });
    }
  });
  
  // Endpoint to verify API key and connectivity for debugging
  app.get("/api/payments/verify-config", isAuthenticated, async (req, res) => {
    try {
      const apiKeyConfigured = isNOWPaymentsConfigured();
      const ipnSecretConfigured = isIPNSecretConfigured();
      
      let apiStatus = "unknown";
      let minAmount = null;
      
      if (apiKeyConfigured) {
        try {
          const status = await nowPaymentsService.getStatus();
          apiStatus = status.status || "unknown";
          
          // Try to get minimum amount
          try {
            minAmount = await nowPaymentsService.getMinimumPaymentAmount("USDT");
          } catch (minAmountError) {
            console.error("Failed to get minimum amount:", minAmountError);
          }
        } catch (statusError) {
          apiStatus = "error";
          console.error("Failed to get NOWPayments status:", statusError);
        }
      }
      
      res.json({
        apiKeyConfigured,
        ipnSecretConfigured,
        apiStatus,
        minAmount,
        config: {
          callbackUrl: `${config.urls.api}/api/payments/callback`,
          successUrl: `${config.urls.app}/wallet?payment=success`,
          cancelUrl: `${config.urls.app}/wallet?payment=cancelled`
        }
      });
    } catch (error) {
      console.error("Error verifying NOWPayments config:", error);
      res.status(500).json({ error: "Failed to verify payment configuration" });
    }
  });
  
  // Create a NOWPayments invoice for popup checkout
  app.post("/api/payments/create-invoice", isAuthenticated, async (req, res) => {
    try {
      const schema = z.object({
        amount: z.number().positive(),
        currency: z.string().optional()
      });
      
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid request parameters", details: result.error });
      }

      const { amount, currency = 'USD' } = result.data;
      const user = req.user as any;
      
      // Generate success and cancel URLs with the app URL
      const successUrl = `${config.urls.app}/wallet?payment=success`;
      const cancelUrl = `${config.urls.app}/wallet?payment=cancelled`;
      
      // Set up callback URL for NOWPayments IPN webhook
      const callbackUrl = `${config.urls.api}/api/payments/callback`;
      
      console.log(`Creating NOWPayments invoice for user ${user.id}, amount: ${amount} ${currency}`);
      
      // Create the invoice using NOWPayments API
      const invoice = await nowPaymentsService.createInvoice(
        amount,
        user.id,
        currency,
        successUrl,
        cancelUrl,
        undefined, // Generate a unique order ID
        `ChickFarms deposit - ${amount} ${currency}`,
        callbackUrl
      );
      
      // Create a transaction record in pending state
      await storage.createTransaction(
        user.id,
        'recharge',
        amount,
        invoice.id, // Use the invoice ID as the transaction ID
        undefined,
        JSON.stringify({ method: 'nowpayments_popup', invoiceId: invoice.id })
      );
      
      console.log(`Created invoice with ID ${invoice.id}, popup URL: ${invoice.invoice_url}`);
      
      // Return the NOWPayments invoice URL to open in a popup/iframe
      res.json({
        success: true,
        invoiceId: invoice.id,
        invoiceUrl: invoice.invoice_url
      });
    } catch (error) {
      console.error("Error creating NOWPayments invoice:", error);
      res.status(500).json({ error: "Failed to create payment invoice" });
    }
  });
  
  // Check the status of a NOWPayments invoice
  app.get("/api/payments/invoice-status/:invoiceId", isAuthenticated, async (req, res) => {
    try {
      const { invoiceId } = req.params;
      const user = req.user as any;
      
      // Find the transaction with the given invoice ID
      const transaction = await storage.getTransactionByTransactionId(invoiceId);
      
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      
      // Check if the transaction belongs to the current user
      if (transaction.userId !== user.id && !user.isAdmin) {
        return res.status(403).json({ error: "Not authorized to view this transaction" });
      }
      
      // Get payment status from the transaction
      res.json({
        success: true,
        status: transaction.status,
        amount: transaction.amount,
        transactionId: transaction.transactionId,
        createdAt: transaction.createdAt
      });
    } catch (error) {
      console.error("Error checking invoice status:", error);
      res.status(500).json({ error: "Failed to check invoice status" });
    }
  });

  app.get("/api/payments/currencies", async (req, res) => {
    try {
      const currencies = await nowPaymentsService.getAvailableCurrencies();
      res.json(currencies);
    } catch (error) {
      console.error("Error retrieving available currencies:", error);
      res.status(500).json({ error: "Failed to retrieve available currencies" });
    }
  });

  app.get("/api/payments/min-amount", async (req, res) => {
    try {
      const currency = req.query.currency as string || "USDT";
      const minAmount = await nowPaymentsService.getMinimumPaymentAmount(currency);
      res.json({ minAmount, currency });
    } catch (error) {
      console.error("Error retrieving minimum amount:", error);
      res.status(500).json({ error: "Failed to retrieve minimum payment amount" });
    }
  });
  
  // NOWPayments IPN callback endpoint
  app.post("/api/payments/callback", async (req, res) => {
    try {
      console.log("[NOWPayments Callback] Received payment callback:", JSON.stringify(req.body));
      
      // Extract payment data from the IPN callback
      const ipnData = req.body;
      
      // Verify the IPN signature if NOWPayments IPN secret is provided
      const ipnSecret = config.nowpayments.ipnSecret;
      const isIpnConfigured = isIPNSecretConfigured();
      
      console.log("[NOWPayments Callback] IPN Secret configured:", isIpnConfigured ? "YES" : "NO");
      
      if (ipnSecret && isIpnConfigured) {
        // Get the signature from headers
        const ipnSignature = req.headers['x-nowpayments-sig'];
        
        if (!ipnSignature) {
          console.error("[NOWPayments Callback] Missing signature in IPN headers");
          console.error("[NOWPayments Callback] Headers received:", JSON.stringify(req.headers));
          return res.status(400).json({ error: "Missing signature" });
        }
        
        // Verify the signature
        const crypto = require('crypto');
        const hmac = crypto.createHmac('sha512', ipnSecret);
        const rawBody = typeof ipnData === 'string' ? ipnData : JSON.stringify(ipnData);
        const computedSignature = hmac.update(rawBody).digest('hex');
        
        console.log("[NOWPayments Callback] Signature verification:");
        console.log("Received signature:", ipnSignature);
        console.log("Computed signature:", computedSignature);
        
        // Check if signatures match
        if (computedSignature !== ipnSignature) {
          console.error("[NOWPayments Callback] Invalid IPN signature");
          return res.status(403).json({ error: "Invalid signature" });
        }
        
        console.log("[NOWPayments Callback] IPN signature verified successfully");
      } else {
        console.warn("[NOWPayments Callback] IPN secret not configured or invalid, skipping signature verification");
      }
      
      if (!ipnData.payment_id) {
        console.error("[NOWPayments Callback] Missing payment_id in IPN data");
        return res.status(400).json({ error: "Missing payment_id" });
      }
      
      // Get the payment details
      const paymentId = ipnData.payment_id;
      const paymentStatus = ipnData.payment_status;
      
      console.log(`[NOWPayments Callback] Processing payment ${paymentId} with status ${paymentStatus}`);
      
      // Retrieve our transaction using the payment ID
      const transaction = await storage.getTransactionByTransactionId(paymentId);
      
      if (!transaction) {
        console.error(`[NOWPayments Callback] Transaction not found for payment ID ${paymentId}`);
        return res.status(404).json({ error: "Transaction not found" });
      }
      
      console.log(`[NOWPayments Callback] Found transaction ID ${transaction.id} for user ${transaction.userId}`);
      
      // Map the NOWPayments status to our transaction status
      const newStatus = nowPaymentsService.mapPaymentStatusToTransactionStatus(paymentStatus);
      
      // Only process completed payments
      if (newStatus === "completed" && transaction.status !== "completed") {
        console.log(`[NOWPayments Callback] Updating transaction ${transaction.id} to status ${newStatus}`);
        
        // Update transaction status
        await storage.updateTransactionStatus(paymentId, newStatus);
        
        // Get the user
        const user = await storage.getUser(transaction.userId);
        if (!user) {
          console.error(`[NOWPayments Callback] User ${transaction.userId} not found`);
          return res.status(404).json({ error: "User not found" });
        }
        
        console.log(`[NOWPayments Callback] Updating balance for user ${user.id}, adding ${transaction.amount}`);
        
        // Update user's balance
        await storage.updateUserBalance(user.id, parseFloat(transaction.amount));
        
        // Check if this is the user's first deposit
        const userTransactions = await storage.getTransactionsByUserId(user.id);
        const completedDeposits = userTransactions.filter(t => 
          t.type === "recharge" && 
          t.status === "completed" && 
          t.id !== transaction.id // Exclude current transaction
        );
        
        const isFirstDeposit = completedDeposits.length === 0;
        
        // Apply first deposit bonus if applicable
        if (isFirstDeposit) {
          const bonusAmount = parseFloat(transaction.amount) * 0.1; // 10% bonus
          console.log(`[NOWPayments Callback] Applying first deposit bonus: ${bonusAmount} for user ${user.id}`);
          
          // Create bonus transaction
          await storage.createTransaction(
            user.id,
            "bonus",
            bonusAmount,
            `bonus-${transaction.transactionId}`,
            undefined,
            JSON.stringify({ reason: "First deposit bonus" })
          );
          
          // Add bonus to user's balance
          await storage.updateUserBalance(user.id, bonusAmount);
        }
        
        // Process referral commission if applicable
        if (user.referredBy) {
          try {
            // Find the referrer
            const referrer = await storage.getUserByReferralCode(user.referredBy);
            if (referrer) {
              console.log(`[NOWPayments Callback] Processing referral commission for referrer ${referrer.id}`);
              
              // Calculate level 1 commission (10% of deposit)
              const level1Amount = parseFloat(transaction.amount) * 0.1;
              
              // Update referrer's earnings
              await storage.updateUserBalance(referrer.id, level1Amount);
              await storage.updateUserReferralEarnings(referrer.id, level1Amount);
              await storage.updateUserTeamEarnings(referrer.id, level1Amount);
              
              // Record the referral earning
              await storage.createReferralEarning({
                userId: referrer.id,
                referredUserId: user.id,
                level: 1,
                amount: level1Amount.toFixed(2),
                claimed: false
              });
              
              // Process higher level referrals
              let currentReferrer = referrer;
              
              // Process levels 2-6 (if applicable)
              for (let level = 2; level <= 6; level++) {
                if (!currentReferrer.referredBy) break;
                
                const nextReferrer = await storage.getUserByReferralCode(currentReferrer.referredBy);
                if (!nextReferrer) break;
                
                // Calculate commission based on level
                let commissionRate = 0;
                switch (level) {
                  case 2: commissionRate = 0.05; break; // 5%
                  case 3: commissionRate = 0.03; break; // 3%
                  case 4: commissionRate = 0.02; break; // 2%
                  case 5: commissionRate = 0.01; break; // 1%
                  case 6: commissionRate = 0.01; break; // 1%
                  default: commissionRate = 0;
                }
                
                const commissionAmount = parseFloat(transaction.amount) * commissionRate;
                
                console.log(`[NOWPayments Callback] Processing level ${level} commission: ${commissionAmount} for user ${nextReferrer.id}`);
                
                // Update earnings
                await storage.updateUserBalance(nextReferrer.id, commissionAmount);
                await storage.updateUserReferralEarnings(nextReferrer.id, commissionAmount);
                await storage.updateUserTeamEarnings(nextReferrer.id, commissionAmount);
                
                // Record the referral earning
                await storage.createReferralEarning({
                  userId: nextReferrer.id,
                  referredUserId: user.id,
                  level,
                  amount: commissionAmount.toFixed(2),
                  claimed: false
                });
                
                // Move to next level referrer
                currentReferrer = nextReferrer;
              }
            }
          } catch (referralError) {
            console.error("[NOWPayments Callback] Error processing referral commissions:", referralError);
            // Continue execution - don't fail the payment process because of referral issues
          }
        }
      } else {
        console.log(`[NOWPayments Callback] Transaction status unchanged or not completed: ${paymentStatus}`);
      }
      
      // Always return 200 OK to NOWPayments
      res.status(200).json({ status: "success" });
    } catch (error) {
      console.error("[NOWPayments Callback] Error processing payment callback:", error);
      // Always return 200 OK to NOWPayments even on error to prevent retries
      res.status(200).json({ status: "error", message: "Error processing payment callback" });
    }
  });
  
  // Commented out duplicate endpoint

  // Public payment status check endpoint (no authentication required)
  app.get("/api/public/payments/:paymentId/status", async (req, res) => {
    try {
      const paymentId = req.params.paymentId;
      
      // Check if this is our transaction
      const transaction = await storage.getTransactionByTransactionId(paymentId);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      
      // Initialize default payment status
      let paymentStatus = {
        payment_id: paymentId,
        payment_status: transaction.status === 'pending' ? 'waiting' : transaction.status,
        pay_address: '',
        price_amount: parseFloat(transaction.amount),
        price_currency: 'USDT',
        pay_amount: parseFloat(transaction.amount),
        pay_currency: 'USDT',
        created_at: transaction.createdAt,
        actually_paid: null,
        actually_paid_at: null,
        updated_at: null
      };
      
      try {
        // Check if this is a manual payment (starts with 'M')
        if (paymentId.startsWith('M')) {
          // For manual payments, just use the default status from our DB
          if (typeof transaction.bankDetails === 'string') {
            try {
              const details = JSON.parse(transaction.bankDetails);
              if (details.paymentAddress) {
                paymentStatus.pay_address = details.paymentAddress;
              }
            } catch (e) {
              console.error('[Payment Status] Error parsing bankDetails:', e);
            }
          }
          console.log(`[Payment Status] Manual payment ${paymentId} status: ${paymentStatus.payment_status}`);
        } else {
          // For NOWPayments payments, check the status via API
          try {
            const apiPaymentStatus = await nowPaymentsService.getPaymentStatus(paymentId);
            // Update our status object with API response
            // Convert date strings to proper format and handle nulls correctly
            paymentStatus = {
              ...apiPaymentStatus,
              // Don't try to convert to Date objects in the API response to avoid type errors
              created_at: apiPaymentStatus.created_at || (transaction.createdAt instanceof Date ? transaction.createdAt.toISOString() : String(transaction.createdAt)),
              actually_paid: apiPaymentStatus.actually_paid || null, // Ensure it's never undefined
              actually_paid_at: apiPaymentStatus.actually_paid_at || null, // Ensure it's never undefined
              updated_at: apiPaymentStatus.updated_at || null // Ensure it's never undefined
            };
          } catch (apiError) {
            console.error(`[NOWPayments] API error getting payment status:`, apiError);
            // Continue with the default status
          }
        }
        
        // Return payment status (this endpoint doesn't process any updates)
        res.json({
          transaction: {
            id: transaction.id,
            status: transaction.status,
            amount: transaction.amount,
            createdAt: transaction.createdAt
          },
          payment: {
            paymentId: paymentStatus.payment_id,
            status: paymentStatus.payment_status,
            payAddress: paymentStatus.pay_address,
            amount: paymentStatus.pay_amount,
            currency: paymentStatus.pay_currency,
            actuallyPaid: paymentStatus.actually_paid,
            actuallyPaidAt: paymentStatus.actually_paid_at,
            updatedAt: paymentStatus.updated_at
          }
        });
      } catch (error) {
        console.error(`[NOWPayments] Error checking public payment status:`, error);
        res.status(500).json({ error: "Failed to check payment status" });
      }
    } catch (error) {
      console.error(`[NOWPayments] Error in public payment status:`, error);
      res.status(500).json({ error: "Failed to process payment status" });
    }
  });

  // Authenticated payment status check endpoint
  app.get("/api/payments/:paymentId/status", isAuthenticated, async (req, res) => {
    try {
      const paymentId = req.params.paymentId;
      
      // Check if this is our transaction
      const transaction = await storage.getTransactionByTransactionId(paymentId);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      
      // Verify this transaction belongs to the requesting user
      if (transaction.userId !== req.user!.id) {
        return res.status(403).json({ error: "Unauthorized access to transaction" });
      }
      
      // Initialize default payment status
      let paymentStatus = {
        payment_id: paymentId,
        payment_status: transaction.status === 'pending' ? 'waiting' : transaction.status,
        pay_address: '',
        price_amount: parseFloat(transaction.amount),
        price_currency: 'USDT',
        pay_amount: parseFloat(transaction.amount),
        pay_currency: 'USDT',
        created_at: transaction.createdAt,
        actually_paid: null,
        actually_paid_at: null,
        updated_at: null
      };
      
      try {
        // Check if this is a manual payment (starts with 'M')
        if (paymentId.startsWith('M')) {
          // For manual payments, just use the default status from our DB
          if (typeof transaction.bankDetails === 'string') {
            try {
              const details = JSON.parse(transaction.bankDetails);
              if (details.paymentAddress) {
                paymentStatus.pay_address = details.paymentAddress;
              }
            } catch (e) {
              console.error('[Payment Status] Error parsing bankDetails:', e);
            }
          }
          console.log(`[Payment Status] Manual payment ${paymentId} status: ${paymentStatus.payment_status}`);
        } else {
          // For NOWPayments payments, check the status via API
          try {
            const apiPaymentStatus = await nowPaymentsService.getPaymentStatus(paymentId);
            // Update our status object with API response - maintain type compatibility
            // by handling each property individually instead of directly assigning the object
            if (apiPaymentStatus) {
              paymentStatus.payment_id = apiPaymentStatus.payment_id;
              paymentStatus.payment_status = apiPaymentStatus.payment_status;
              paymentStatus.pay_address = apiPaymentStatus.pay_address;
              paymentStatus.price_amount = apiPaymentStatus.price_amount;
              paymentStatus.price_currency = apiPaymentStatus.price_currency;
              paymentStatus.pay_amount = apiPaymentStatus.pay_amount;
              paymentStatus.pay_currency = apiPaymentStatus.pay_currency;
              // Handle optional properties with caution to maintain type compatibility
              if (apiPaymentStatus.created_at) {
                paymentStatus.created_at = transaction.createdAt; // Use our transaction date for type safety
              }
              paymentStatus.actually_paid = null; // Ensure type compatibility
              paymentStatus.actually_paid_at = null; // Ensure type compatibility
              paymentStatus.updated_at = null; // Ensure type compatibility
            }
          } catch (apiError) {
            console.error(`[NOWPayments] API error getting payment status:`, apiError);
            // Continue with the default status
          }
        }
      
        // If payment is completed but our transaction is still pending, update it
        if (paymentStatus.payment_status === 'finished' && transaction.status === 'pending') {
          console.log(`[NOWPayments] Payment ${paymentId} is completed, updating transaction status`);
          
          // Update transaction status
          await storage.updateTransactionStatus(paymentId, "completed");
          
          // Update user balance
          await storage.updateUserBalance(req.user!.id, parseFloat(transaction.amount));
          
          // Process referral commissions if applicable
          const user = await storage.getUser(req.user!.id);
          if (user && user.referredBy) {
            try {
              // Find the referrer
              const referrer = await storage.getUserByReferralCode(user.referredBy);
              if (referrer) {
                console.log(`[NOWPayments] Processing referral commission for payment ${paymentId}`);
                
                // Calculate level 1 commission (10% of deposit)
                const level1Amount = parseFloat(transaction.amount) * 0.1;
                
                // Update referrer's earnings
                await storage.updateUserBalance(referrer.id, level1Amount);
                await storage.updateUserReferralEarnings(referrer.id, level1Amount);
                await storage.updateUserTeamEarnings(referrer.id, level1Amount);
                
                // Record the referral earning
                await storage.createReferralEarning({
                  userId: referrer.id,
                  referredUserId: req.user!.id,
                  level: 1,
                  amount: level1Amount.toFixed(2),
                  claimed: false
                });
                
                // Process higher level referrals as well (levels 2-6)
                // Follow the same pattern as in the existing referral processing
              }
            } catch (referralError) {
              console.error(`[NOWPayments] Error processing referral for payment ${paymentId}:`, referralError);
              // Continue execution - don't fail the payment update because of referral issues
            }
          }
        }
      } catch (innerError) {
        console.error(`[NOWPayments] Inner error checking payment status:`, innerError);
        // Don't throw, just continue with default status
      }
      
      // Return both our transaction status and the payment status
      res.json({
        transaction: {
          id: transaction.id,
          status: transaction.status,
          amount: transaction.amount,
          createdAt: transaction.createdAt
        },
        payment: {
          paymentId: paymentStatus.payment_id,
          status: paymentStatus.payment_status,
          payAddress: paymentStatus.pay_address,
          amount: paymentStatus.pay_amount,
          currency: paymentStatus.pay_currency,
          actuallyPaid: paymentStatus.actually_paid,
          actuallyPaidAt: paymentStatus.actually_paid_at,
          updatedAt: paymentStatus.updated_at
        }
      });
    } catch (error) {
      console.error(`[NOWPayments] Error checking payment status:`, error);
      res.status(500).json({ error: "Failed to check payment status" });
    }
  });

  // Admin routes
  app.get("/api/admin/transactions", async (req, res) => {
    try {
      console.log('[Admin Route] Getting transactions');
      const transactions = await storage.getTransactions();
      res.json(transactions);
    } catch (err) {
      console.error('[Admin Route] Error getting transactions:', err);
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  });

  // Admin withdrawals endpoint
  app.get("/api/admin/withdrawals", async (req, res) => {
    const transactions = await storage.getTransactions();
    // Filter only withdrawal transactions
    const withdrawals = transactions.filter(transaction => transaction.type === "withdrawal");
    res.json(withdrawals);
  });

  // Admin stats endpoint
  app.get("/api/admin/stats", async (req, res) => {
    const transactions = await storage.getTransactions();
    const users = await storage.getUser(1); // Just to get the total users count

    // Calculate today's date (start and end)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Calculate yesterday's date (start and end)
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Filter transactions for deposits and withdrawals
    const todayDeposits = transactions
      .filter(t => t.type === "recharge" && t.status === "completed" && new Date(t.createdAt) >= today && new Date(t.createdAt) < tomorrow)
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const totalDeposits = transactions
      .filter(t => t.type === "recharge" && t.status === "completed")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    // Calculate withdrawal statistics
    const todayWithdrawals = transactions
      .filter(t => t.type === "withdrawal" && t.status === "completed" && new Date(t.createdAt) >= today && new Date(t.createdAt) < tomorrow)
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const totalWithdrawals = transactions
      .filter(t => t.type === "withdrawal" && t.status === "completed")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const pendingWithdrawals = transactions.filter(t => t.type === "withdrawal" && t.status === "pending").length;

    const stats = {
      todayLogins: 5,
      yesterdayLogins: 8,
      totalUsers: 10,
      todayDeposits,
      totalDeposits,
      todayWithdrawals,
      totalWithdrawals,
      pendingWithdrawals
    };

    res.json(stats);
  });

  app.get("/api/admin/prices", async (req, res) => {
    try {
      const prices = await storage.getPrices();
      // Transform prices array into GamePrices object
      const gamePrices = {
        waterBucketPrice: parseFloat(prices.find(p => p.itemType === 'water_bucket')?.price || '0.5'),
        wheatBagPrice: parseFloat(prices.find(p => p.itemType === 'wheat_bag')?.price || '0.5'),
        eggPrice: parseFloat(prices.find(p => p.itemType === 'egg')?.price || '0.1'),
        babyChickenPrice: parseFloat(prices.find(p => p.itemType === 'baby_chicken')?.price || '90'),
        regularChickenPrice: parseFloat(prices.find(p => p.itemType === 'regular_chicken')?.price || '150'),
        goldenChickenPrice: parseFloat(prices.find(p => p.itemType === 'golden_chicken')?.price || '400'),
        withdrawalTaxPercentage: 5 // Default value, you might want to get this from settings table
      };
      res.json(gamePrices);
    } catch (err) {
      console.error('Error fetching game prices:', err);
      res.status(500).json({ error: 'Failed to fetch game prices' });
    }
  });

  app.post("/api/admin/prices/update", async (req, res) => {
    try {
      console.log('Received price updates:', req.body.prices);

      // Validate the array of price updates
      if (!Array.isArray(req.body.prices)) {
        console.error('Invalid price updates format:', req.body);
        return res.status(400).json({ error: "Invalid price updates format" });
      }

      // Update each price
      for (const priceUpdate of req.body.prices) {
        const schema = z.object({
          itemType: z.string(),
          price: z.number().positive(),
        });

        const result = schema.safeParse(priceUpdate);
        if (!result.success) {
          console.error('Invalid price update:', priceUpdate, result.error);
          continue;
        }

        console.log('Updating price:', result.data);
        await storage.updatePrice(result.data.itemType, result.data.price);
      }

      // Update withdrawal tax if provided
      if (typeof req.body.withdrawalTaxPercentage === 'number') {
        console.log('Updating withdrawal tax:', req.body.withdrawalTaxPercentage);
        await storage.updateWithdrawalTax(req.body.withdrawalTaxPercentage);
      }

      // Get updated prices to verify changes
      const updatedPrices = await storage.getPrices();
      console.log('Updated prices:', updatedPrices);

      res.json({ success: true, prices: updatedPrices });
    } catch (err) {
      console.error('Error updating prices:', err);
      res.status(500).json({ error: 'Failed to update prices' });
    }
  });

  app.get("/api/prices", async (req, res) => {
    try {
      const prices = await storage.getPrices();
      console.log('Fetched prices:', prices);
      res.json(prices);
    } catch (err) {
      console.error('Error fetching prices:', err);
      res.status(500).json({ error: 'Failed to fetch prices' });
    }
  });

  app.post("/api/admin/transactions/update", async (req, res) => {
    const schema = z.object({
      transactionId: z.string(),
      status: z.enum(["completed", "rejected"]),
    });

    const result = schema.safeParse(req.body);
    if (!result.success) return res.status(400).json(result.error);

    try {
      console.log(`[Admin] Updating transaction ${result.data.transactionId} to status: ${result.data.status}`);
      
      await storage.updateTransactionStatus(
        result.data.transactionId,
        result.data.status
      );

      const transaction = await storage.getTransactionByTransactionId(result.data.transactionId);
      if (!transaction) {
        console.error(`[Admin] Transaction not found: ${result.data.transactionId}`);
        return res.status(404).send("Transaction not found");
      }

      console.log(`[Admin] Found transaction:`, JSON.stringify(transaction));
      
      let isFirstDeposit = false;
      let bonusAmount = 0;

      // If approved deposit, update user's balance
      if (result.data.status === "completed" && transaction.type === "recharge") {
        const finalAmount = parseFloat(transaction.amount);
        console.log(`[Admin] Processing approved recharge: $${finalAmount}`);
        
        // Add the main deposit amount to user's balance
        await storage.updateUserBalance(transaction.userId, finalAmount);
        console.log(`[Admin] Added $${finalAmount} to user ${transaction.userId} balance`);
        
        // Get user info first to check for referrals
        let user;
        try {
          user = await storage.getUser(transaction.userId);
          console.log(`[Admin] Retrieved user:`, JSON.stringify(user));
        } catch (userLookupError) {
          console.error("[Admin] Error retrieving user:", userLookupError);
          // Continue execution - we'll try to process what we can
        }
        
        // Check if this is user's first deposit
        try {
          const userTransactions = await storage.getTransactionsByUserId(transaction.userId);
          console.log(`[Admin] Found ${userTransactions.length} transactions for user ${transaction.userId}`);
          
          const previousDeposits = userTransactions.filter(t => 
            t.type === "recharge" && 
            t.status === "completed" && 
            t.id !== transaction.id  // Exclude current transaction
          );
          isFirstDeposit = previousDeposits.length === 0;
          console.log(`[Admin] Is first deposit: ${isFirstDeposit}`);
          
          // Apply 10% first deposit bonus
          if (isFirstDeposit) {
            bonusAmount = finalAmount * 0.1; // 10% bonus
            console.log(`[Admin] Applying first deposit bonus: $${bonusAmount}`);
            
            // Create bonus transaction
            await storage.createTransaction(
              transaction.userId,
              "bonus",
              bonusAmount,
              `bonus-${transaction.transactionId}`,
              undefined,
              JSON.stringify({ reason: "First deposit bonus" })
            );
            
            // Add the bonus to user's balance
            await storage.updateUserBalance(transaction.userId, bonusAmount);
            console.log(`[Admin] Added bonus $${bonusAmount} to user ${transaction.userId} balance`);
          }
        } catch (depositCheckError) {
          console.error("[Admin] Error checking first deposit status:", depositCheckError);
          // Continue execution - don't fail because of bonus check
        }

        // Process referral commission if applicable
        if (user && user.referredBy) {
          try {
            console.log(`[Admin] User was referred by: ${user.referredBy}`);
            const referrer = await storage.getUserByReferralCode(user.referredBy);
            
            if (referrer) {
              console.log(`[Admin] Found referrer: ${referrer.id}`);
              
              // Apply referral commission calculation (Level 1 - 10%)
              const commission = finalAmount * 0.10; // 10% referral commission
              await storage.updateUserBalance(referrer.id, commission);
              await storage.updateUserReferralEarnings(referrer.id, commission);
              await storage.updateUserTeamEarnings(referrer.id, commission);
              console.log(`[Admin] Added commission $${commission} to referrer ${referrer.id}`);
              
              try {
                // Record the referral earning
                await storage.createReferralEarning({
                  userId: referrer.id,
                  referredUserId: transaction.userId,
                  level: 1, // Direct referral level
                  amount: commission.toString(), // Convert to string for decimal type
                  claimed: false
                });
                console.log(`[Admin] Created referral earning record`);
                
                // Process higher level referrals (up to 6 levels)
                let currentReferrer = referrer;
                
                for (let level = 2; level <= 6; level++) {
                  if (!currentReferrer.referredBy) break;
                  
                  // Find the next level referrer
                  const nextReferrer = await storage.getUserByReferralCode(currentReferrer.referredBy);
                  if (!nextReferrer) break;
                  
                  // Get commission rate for this level
                  let commissionRate = 0;
                  switch (level) {
                    case 2: commissionRate = 0.06; break; // 6% for level 2
                    case 3: commissionRate = 0.04; break; // 4% for level 3
                    case 4: commissionRate = 0.03; break; // 3% for level 4
                    case 5: commissionRate = 0.02; break; // 2% for level 5
                    case 6: commissionRate = 0.01; break; // 1% for level 6
                  }
                  
                  // Calculate commission amount
                  const higherLevelCommission = finalAmount * commissionRate;
                  
                  // Create earnings record
                  await storage.createReferralEarning({
                    userId: nextReferrer.id,
                    referredUserId: transaction.userId,
                    level,
                    amount: higherLevelCommission.toFixed(2),
                    claimed: false
                  });
                  
                  // Update referrer's total earnings
                  await storage.updateUserReferralEarnings(nextReferrer.id, higherLevelCommission);
                  await storage.updateUserTeamEarnings(nextReferrer.id, higherLevelCommission);
                  console.log(`[Admin] Added level ${level} commission $${higherLevelCommission.toFixed(2)} to referrer ${nextReferrer.id}`);
                  
                  // Move to next level referrer
                  currentReferrer = nextReferrer;
                }
              } catch (referralEarningError) {
                console.error("[Admin] Error creating referral earning:", referralEarningError);
              }
              
              // Give a 10% bonus to the referred user if they haven't received the first deposit bonus yet
              // This handles edge cases where the first deposit check might have failed
              if (!isFirstDeposit) {
                console.log(`[Admin] Double checking to ensure referral bonus is applied`);
                // Check if any bonus transactions exist for this user
                const userBonuses = await storage.getTransactionsByUserId(transaction.userId);
                const hasReceivedBonus = userBonuses.some(t => t.type === "bonus" && t.status === "completed");
                
                if (!hasReceivedBonus) {
                  console.log(`[Admin] No prior bonus found, applying referral bonus`);
                  // Apply the bonus now
                  bonusAmount = finalAmount * 0.1; // 10% bonus
                  
                  // Create bonus transaction
                  await storage.createTransaction(
                    transaction.userId,
                    "bonus",
                    bonusAmount,
                    `bonus-ref-${transaction.transactionId}`,
                    undefined,
                    JSON.stringify({ reason: "Referral deposit bonus" })
                  );
                  
                  // Add the bonus to user's balance
                  await storage.updateUserBalance(transaction.userId, bonusAmount);
                  console.log(`[Admin] Added bonus $${bonusAmount} to referred user ${transaction.userId} balance`);
                  
                  // Set isFirstDeposit flag to true so it's included in the response
                  isFirstDeposit = true;
                }
              }
            }
          } catch (referralError) {
            console.error("[Admin] Error processing referral commissions:", referralError);
            // Continue execution - don't fail the deposit because of referral issues
          }
        }
      }

      console.log(`[Admin] Transaction update completed successfully`);
      res.json({ 
        success: true, 
        status: result.data.status,
        isFirstDeposit, 
        bonusAmount,
        transactionId: transaction.transactionId 
      });
    } catch (err) {
      console.error("[Admin] Error updating transaction:", err);
      if (err instanceof Error) {
        res.status(400).send(err.message);
      } else {
        res.status(400).send("Failed to update transaction");
      }
    }
  });

  app.post("/api/admin/qrcode", async (req, res) => {
    const schema = z.object({
      address: z.string(),
    });

    const result = schema.safeParse(req.body);
    if (!result.success) return res.status(400).json(result.error);

    try {
      await storage.updatePaymentAddress(result.data.address);
      res.json({ success: true });
    } catch (err) {
      if (err instanceof Error) {
        res.status(400).send(err.message);
      } else {
        res.status(400).send("Failed to update payment address");
      }
    }
  });

  app.post("/api/admin/withdrawal-tax", async (req, res) => {
    const schema = z.object({
      taxPercentage: z.number().min(0).max(100),
    });

    const result = schema.safeParse(req.body);
    if (!result.success) return res.status(400).json(result.error);

    try {
      await storage.updateWithdrawalTax(result.data.taxPercentage);
      res.json({ success: true });
    } catch (err) {
      if (err instanceof Error) {
        res.status(400).send(err.message);
      } else {
        res.status(400).send("Failed to update withdrawal tax");
      }
    }
  });
  
  // Admin endpoint to update referral counts for all users
  app.post("/api/admin/update-referral-counts", async (req, res) => {
    try {
      console.log('[Admin Route] Updating referral counts for all users');
      await storage.updateReferralCounts();
      res.json({ success: true, message: 'Referral counts updated successfully' });
    } catch (err) {
      if (err instanceof Error) {
        res.status(500).send(err.message);
      } else {
        res.status(500).send("Failed to update referral counts");
      }
    }
  });

  // Chickens
  app.get("/api/chickens", isAuthenticated, async (req, res) => {
    const chickens = await storage.getChickensByUserId(req.user!.id);
    res.json(chickens);
  });

  app.post("/api/chickens/buy", isAuthenticated, async (req, res) => {
    const schema = z.object({ type: z.enum(["baby", "regular", "golden"]) });
    const result = schema.safeParse(req.body);
    if (!result.success) return res.status(400).json(result.error);

    const prices = await storage.getPrices();
    const price = prices.find(p => p.itemType === `${result.data.type}_chicken`);
    if (!price) return res.status(400).send("Invalid chicken type");

    try {
      await storage.updateUserBalance(req.user!.id, -parseFloat(price.price));
      const chicken = await storage.createChicken(req.user!.id, result.data.type);
      res.json(chicken);
    } catch (err) {
      if (err instanceof Error) {
        res.status(400).send(err.message);
      } else {
        res.status(400).send("Failed to buy chicken");
      }
    }
  });

  app.post("/api/chickens/:id/hatch", isAuthenticated, async (req, res) => {
    const chickenId = parseInt(req.params.id);
    const chickens = await storage.getChickensByUserId(req.user!.id);
    const chicken = chickens.find(c => c.id === chickenId);

    if (!chicken) return res.status(404).send("Chicken not found");

    const resources = await storage.getResourcesByUserId(req.user!.id);
    const resourceRequirements = {
      baby: { water: 1, wheat: 1, eggs: 2 },
      regular: { water: 2, wheat: 2, eggs: 5 },
      golden: { water: 10, wheat: 15, eggs: 20 }
    };

    const required = resourceRequirements[chicken.type as keyof typeof resourceRequirements];
    if (resources.waterBuckets < required.water || resources.wheatBags < required.wheat) {
      return res.status(400).send("Insufficient resources");
    }

    // Update resources: decrease water and wheat, increase eggs
    await storage.updateResources(req.user!.id, {
      waterBuckets: resources.waterBuckets - required.water,
      wheatBags: resources.wheatBags - required.wheat,
      eggs: resources.eggs + required.eggs
    });

    await storage.updateChickenHatchTime(chickenId);
    res.json({ success: true });
  });

  app.post("/api/chickens/sell/:id", isAuthenticated, async (req, res) => {
    try {
      const chickenId = parseInt(req.params.id);

      // Verify the chicken exists and belongs to the user
      const chickens = await storage.getChickensByUserId(req.user!.id);
      const chicken = chickens.find(c => c.id === chickenId);

      if (!chicken) {
        return res.status(404).send("Chicken not found");
      }

      // Get the sell price (use 75% of purchase price)
      const prices = await storage.getPrices();
      const price = prices.find(p => p.itemType === `${chicken.type}_chicken`);

      if (!price) {
        return res.status(400).send("Invalid chicken type");
      }

      const sellPrice = parseFloat(price.price) * 0.75; // 75% of purchase price

      // Delete the chicken
      await storage.deleteChicken(chickenId);

      // Add funds to user's balance
      await storage.updateUserBalance(req.user!.id, sellPrice);

      // Create a transaction record
      await storage.createTransaction(
        req.user!.id,
        "sale",
        sellPrice,
        undefined,
        undefined,
        JSON.stringify({ itemType: `${chicken.type}_chicken`, action: "sell" })
      );

      res.json({
        success: true,
        amount: sellPrice
      });
    } catch (err) {
      if (err instanceof Error) {
        res.status(400).send(err.message);
      } else {
        res.status(400).send("Failed to sell chicken");
      }
    }
  });

  // Get chicken counts by type
  app.get("/api/chickens/counts", async (req, res) => {
    try {
      const counts = await storage.getChickenCountsByType();
      res.json(counts);
    } catch (err) {
      if (err instanceof Error) {
        res.status(500).send(err.message);
      } else {
        res.status(500).send("Failed to get chicken counts");
      }
    }
  });

  // Resources
  app.get("/api/resources", isAuthenticated, async (req, res) => {
    try {
      const resources = await storage.getResourcesByUserId(req.user!.id);
      res.json(resources);
    } catch (err) {
      // If resources not found, create a default resource
      try {
        // Create a default resource by updating with empty values
        const defaultResource = await storage.updateResources(req.user!.id, {
          waterBuckets: 0,
          wheatBags: 0,
          eggs: 0
        });
        res.json(defaultResource);
      } catch (err) {
        res.status(500).json({ error: "Failed to create resources" });
      }
    }
  });

  // Market
  app.get("/api/prices", async (req, res) => {
    const prices = await storage.getPrices();
    res.json(prices);
  });

  app.post("/api/market/buy", isAuthenticated, async (req, res) => {
    const schema = z.object({
      itemType: z.enum(["water_bucket", "wheat_bag"]),
      quantity: z.number().positive()
    });

    const result = schema.safeParse(req.body);
    if (!result.success) return res.status(400).json(result.error);

    const prices = await storage.getPrices();
    const price = prices.find(p => p.itemType === result.data.itemType);
    if (!price) return res.status(400).send("Invalid item type");

    const totalCost = parseFloat(price.price) * result.data.quantity;

    try {
      await storage.updateUserBalance(req.user!.id, -totalCost);
      const resources = await storage.getResourcesByUserId(req.user!.id);

      const updates = result.data.itemType === "water_bucket"
        ? { waterBuckets: resources.waterBuckets + result.data.quantity }
        : { wheatBags: resources.wheatBags + result.data.quantity };

      await storage.updateResources(req.user!.id, updates);
      res.json({ success: true });
    } catch (err) {
      if (err instanceof Error) {
        res.status(400).send(err.message);
      } else {
        res.status(400).send("Failed to buy resource");
      }
    }
  });

  app.post("/api/market/sell", isAuthenticated, async (req, res) => {
    const schema = z.object({
      quantity: z.number().positive()
    });

    const result = schema.safeParse(req.body);
    if (!result.success) return res.status(400).json(result.error);

    const resources = await storage.getResourcesByUserId(req.user!.id);
    if (resources.eggs < result.data.quantity) {
      return res.status(400).send("Insufficient eggs");
    }

    const prices = await storage.getPrices();
    const price = prices.find(p => p.itemType === "egg");
    if (!price) return res.status(400).send("Egg price not found");

    const totalEarnings = parseFloat(price.price) * result.data.quantity;

    try {
      await storage.updateUserBalance(req.user!.id, totalEarnings);
      await storage.updateResources(req.user!.id, {
        eggs: resources.eggs - result.data.quantity
      });
      res.json({ success: true });
    } catch (err) {
      if (err instanceof Error) {
        res.status(400).send(err.message);
      } else {
        res.status(400).send("Failed to sell eggs");
      }
    }
  });

  // Wallet
  app.get("/api/transactions", isAuthenticated, async (req, res) => {
    const transactions = await storage.getTransactionsByUserId(req.user!.id);
    res.json(transactions);
  });

  app.post("/api/wallet/recharge", isAuthenticated, async (req, res) => {
    const schema = z.object({
      amount: z.number().positive(),
      currency: z.string().optional().default("USDT"),
      payCurrency: z.string().optional().default("USDT"),
      useInvoice: z.boolean().optional().default(false)
    });

    const result = schema.safeParse(req.body);
    if (!result.success) {
      console.error(`[NOWPayments] Invalid request body:`, req.body);
      return res.status(400).json(result.error);
    }

    try {
      // Create payment via NOWPayments API for automatic payments
      const apiUrl = config.urls.api || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:5000');
      const callbackUrl = `${apiUrl}/api/payments/callback`;
      const appUrl = config.urls.app || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:5000');
      const successUrl = `${appUrl}/wallet?payment=success`;
      const cancelUrl = `${appUrl}/wallet?payment=cancelled`;
      
      console.log(`[NOWPayments] Creating payment for $${result.data.amount} from user ${req.user!.id}`);
      console.log(`[NOWPayments] Callback URL: ${callbackUrl}`);
      console.log(`[NOWPayments] API Key exists: ${!!config.nowpayments.apiKey}`);
      console.log(`[NOWPayments] Using invoice: ${result.data.useInvoice}`);
      
      if (!config.nowpayments.apiKey) {
        // If API key is missing, log warning and fall back to manual payment
        console.warn("[NOWPayments] API Key is missing, falling back to manual payment");
        throw new Error("NOWPayments API Key missing");
      }
      
      try {
        // If useInvoice is true, use invoice system with redirection
        if (result.data.useInvoice) {
          console.log(`[NOWPayments] Creating invoice for redirection to NOWPayments portal`);
          
          const invoice = await nowPaymentsService.createInvoice(
            result.data.amount,
            req.user!.id,
            result.data.currency,
            successUrl,
            cancelUrl,
            undefined, // orderId will be auto-generated
            `ChickFarms deposit - User ID: ${req.user!.id}`,
            callbackUrl
          );
          
          console.log(`[NOWPayments] Invoice created: ${invoice.id}`);
          
          // Create a pending transaction in our database
          const transaction = await storage.createTransaction(
            req.user!.id,
            "recharge",
            result.data.amount,
            invoice.id, // Use NOWPayments invoice ID as our transaction ID
            undefined,
            JSON.stringify({ 
              invoiceDetails: invoice,
              paymentMethod: "nowpayments_invoice" 
            })
          );
          
          // Return both the transaction and the invoice details for redirection
          return res.json({
            transaction,
            invoice: {
              id: invoice.id,
              status: invoice.status,
              invoiceUrl: invoice.invoice_url,
              amount: result.data.amount,
              currency: result.data.currency,
              createdAt: new Date().toISOString(),
            }
          });
        } else {
          // Use direct payment method (original implementation)
          const payment = await nowPaymentsService.createPayment(
            result.data.amount,
            req.user!.id,
            result.data.currency,
            result.data.payCurrency,
            undefined,
            undefined,
            callbackUrl
          );
          
          console.log(`[NOWPayments] Payment created: ${payment.payment_id}`);
          
          // Create a pending transaction in our database
          const transaction = await storage.createTransaction(
            req.user!.id,
            "recharge",
            result.data.amount,
            payment.payment_id, // Use NOWPayments payment ID as our transaction ID
            undefined,
            JSON.stringify({ 
              paymentDetails: payment,
              paymentMethod: "nowpayments" 
            })
          );
          
          // Return both the transaction and the payment details
          return res.json({
            transaction,
            payment: {
              paymentId: payment.payment_id,
              status: payment.payment_status,
              address: payment.pay_address,
              amount: payment.pay_amount,
              currency: payment.pay_currency,
              createdAt: payment.created_at,
            }
          });
        }
      } catch (apiError) {
        console.error('[NOWPayments] API Error:', apiError);
        throw apiError; // Re-throw to be caught by the outer catch block
      }
    } catch (err) {
      console.error("[Payment Error]", err);
      
      // Fall back to manual payment as a last resort
      console.log("[NOWPayments] Falling back to manual payment method due to error");
      
      try {
        // Get the payment address for manual payments
        const gameSettings = await storage.getSettings();
        const paymentAddress = gameSettings?.paymentAddress || "TRX8nHHo2Jd7H9ZwKhh6h8h"; // default address as fallback
        
        // Generate a unique transaction ID for tracking
        const manualTransactionId = `M${Date.now()}${Math.floor(Math.random() * 1000)}`;
        
        // Create a pending transaction in our database
        const transaction = await storage.createTransaction(
          req.user!.id,
          "recharge",
          result.data.amount,
          manualTransactionId,
          undefined,
          JSON.stringify({ 
            paymentMethod: "manual",
            fallbackReason: "NOWPayments API failure"
          })
        );
        
        // Return both the transaction and the payment details
        return res.json({
          transaction,
          payment: {
            paymentId: manualTransactionId,
            status: "waiting",
            address: paymentAddress,
            amount: result.data.amount,
            currency: "USDT",
            createdAt: new Date().toISOString(),
          }
        });
      } catch (fallbackError) {
        console.error("[Payment Fallback Error]", fallbackError);
        if (fallbackError instanceof Error) {
          return res.status(500).send(fallbackError.message);
        } else {
          return res.status(500).send("Failed to process payment");
        }
      }
    }
  });

  app.post("/api/wallet/withdraw", isAuthenticated, async (req, res) => {
    const schema = z.object({
      amount: z.number().positive(),
      usdtAddress: z.string().min(5).max(100)
    });

    const result = schema.safeParse(req.body);
    if (!result.success) return res.status(400).json(result.error);

    try {
      await storage.updateUserBalance(req.user!.id, -result.data.amount);

      // Store USDT address as bankDetails JSON field for compatibility
      const usdtAddressData = JSON.stringify({ usdtAddress: result.data.usdtAddress });

      // Generate a unique transaction ID for withdrawal requests
      const transactionId = `W${Date.now()}${Math.floor(Math.random() * 1000)}`;

      const transaction = await storage.createTransaction(
        req.user!.id,
        "withdrawal",
        result.data.amount,
        transactionId,
        undefined,
        usdtAddressData
      );
      res.json(transaction);
    } catch (err) {
      if (err instanceof Error) {
        res.status(400).send(err.message);
      } else {
        res.status(400).send("Failed to process withdrawal");
      }
    }
  });

  // Mystery Box endpoints
  app.get("/api/mystery-box/count", isAuthenticated, async (req, res) => {
    try {
      const resources = await storage.getResourcesByUserId(req.user!.id);
      console.log(`[MysteryBox] Current box count for user ${req.user!.id}:`, resources.mysteryBoxes);
      res.json({ count: resources.mysteryBoxes || 0 });
    } catch (err) {
      console.error('[MysteryBox] Error fetching box count:', err);
      res.status(500).json({ error: 'Failed to fetch mystery boxes' });
    }
  });

  app.post("/api/mystery-box/buy", isAuthenticated, async (req, res) => {
    const schema = z.object({
      boxType: z.enum(["basic", "standard", "advanced", "legendary"])
    });

    const result = schema.safeParse(req.body);
    if (!result.success) return res.status(400).json(result.error);

    try {
      console.log(`[MysteryBox] Buying box type: ${result.data.boxType} for user ${req.user!.id}`);
      await storage.purchaseMysteryBox(req.user!.id, result.data.boxType);

      const boxConfig = mysteryBoxTypes[result.data.boxType];
      res.json({
        success: true,
        boxType: result.data.boxType,
        price: boxConfig.price
      });
    } catch (err) {
      console.error('[MysteryBox] Error purchasing box:', err);
      if (err instanceof Error) {
        res.status(400).send(err.message);
      } else {
        res.status(400).send("Failed to purchase mystery box");
      }
    }
  });

  app.post("/api/mystery-box/open", isAuthenticated, async (req, res) => {
    const schema = z.object({
      boxType: z.enum(["basic", "standard", "advanced", "legendary"]).optional()
    });

    const result = schema.safeParse(req.body);
    if (!result.success) return res.status(400).json(result.error);

    try {
      console.log(`[MysteryBox] Opening box for user ${req.user!.id}, type:`, result.data.boxType);
      const reward = await storage.openMysteryBox(req.user!.id, result.data.boxType || "basic");

      if (!reward) {
        console.error('[MysteryBox] Failed to generate reward');
        return res.status(400).send("Failed to open mystery box");
      }

      console.log(`[MysteryBox] Successfully opened box, reward:`, reward);
      res.json({
        success: true,
        reward
      });
    } catch (err) {
      console.error('[MysteryBox] Error opening box:', err);
      if (err instanceof Error) {
        res.status(400).send(err.message);
      } else {
        res.status(400).send("Failed to open mystery box");
      }
    }
  });

  app.get("/api/mystery-box/rewards", isAuthenticated, async (req, res) => {
    try {
      const rewards = await storage.getMysteryBoxRewardsByUserId(req.user!.id);
      console.log(`[MysteryBox] Retrieved rewards for user ${req.user!.id}:`, rewards.length);
      res.json(rewards);
    } catch (err) {
      console.error('[MysteryBox] Error fetching rewards:', err);
      res.status(500).json({ error: 'Failed to fetch mystery box rewards' });
    }
  });

  app.post("/api/mystery-box/claim/:id", isAuthenticated, async (req, res) => {
    try {
      const rewardId = parseInt(req.params.id);
      if (isNaN(rewardId)) {
        console.error('[MysteryBox] Invalid reward ID:', req.params.id);
        return res.status(400).send("Invalid reward ID");
      }

      console.log(`[MysteryBox] Claiming reward ${rewardId} for user ${req.user!.id}`);
      const claimedReward = await storage.claimMysteryBoxReward(rewardId);

      console.log(`[MysteryBox] Successfully claimed reward:`, claimedReward);
      res.json({
        success: true,
        reward: claimedReward
      });
    } catch (err) {
      console.error('[MysteryBox] Error claiming reward:', err);
      if (err instanceof Error) {
        res.status(400).send(err.message);
      } else {
        res.status(400).send("Failed to claim reward");
      }
    }
  });

  // Referral System Routes
  app.get("/api/referrals", isAuthenticated, async (req, res) => {
    try {
      const directReferrals = await storage.getUserReferrals(req.user!.id);
      res.json(directReferrals);
    } catch (err) {
      console.error("Error getting referrals:", err);
      res.status(500).json({ error: "Failed to get referrals" });
    }
  });

  app.get("/api/referrals/earnings", isAuthenticated, async (req, res) => {
    try {
      const earnings = await storage.getReferralEarningsByUserId(req.user!.id);
      res.json(earnings);
    } catch (err) {
      console.error("Error getting referral earnings:", err);
      res.status(500).json({ error: "Failed to get referral earnings" });
    }
  });

  app.get("/api/referrals/earnings/unclaimed", isAuthenticated, async (req, res) => {
    try {
      const unclaimedEarnings = await storage.getUnclaimedReferralEarnings(req.user!.id);
      res.json(unclaimedEarnings);
    } catch (err) {
      console.error("Error getting unclaimed referral earnings:", err);
      res.status(500).json({ error: "Failed to get unclaimed referral earnings" });
    }
  });

  app.post("/api/referrals/earnings/:id/claim", isAuthenticated, async (req, res) => {
    try {
      const earningId = parseInt(req.params.id);
      const claimed = await storage.claimReferralEarning(earningId);
      res.json({
        success: true,
        claimed
      });
    } catch (err) {
      if (err instanceof Error) {
        res.status(400).send(err.message);
      } else {
        res.status(400).send("Failed to claim referral earning");
      }
    }
  });

  // Team milestone routes
  app.get("/api/milestones", isAuthenticated, async (req, res) => {
    try {
      const milestones = await storage.getMilestoneRewardsByUserId(req.user!.id);
      res.json(milestones);
    } catch (err) {
      console.error("Error getting milestone rewards:", err);
      res.status(500).json({ error: "Failed to get milestone rewards" });
    }
  });

  app.get("/api/milestones/unclaimed", isAuthenticated, async (req, res) => {
    try {
      const unclaimedMilestones = await storage.getUnclaimedMilestoneRewards(req.user!.id);
      res.json(unclaimedMilestones);
    } catch (err) {
      console.error("Error getting unclaimed milestone rewards:", err);
      res.status(500).json({ error: "Failed to get unclaimed milestone rewards" });
    }
  });

  app.post("/api/milestones/:id/claim", isAuthenticated, async (req, res) => {
    try {
      const milestoneId = parseInt(req.params.id);
      const claimed = await storage.claimMilestoneReward(milestoneId);
      res.json({
        success: true,
        claimed
      });
    } catch (err) {
      if (err instanceof Error) {
        res.status(400).send(err.message);
      } else {
        res.status(400).send("Failed to claim milestone reward");
      }
    }
  });

  // Salary system routes
  app.get("/api/salary/payments", isAuthenticated, async (req, res) => {
    try {
      const payments = await storage.getSalaryPaymentsByUserId(req.user!.id);
      res.json(payments);
    } catch (err) {
      console.error("Error getting salary payments:", err);
      res.status(500).json({ error: "Failed to get salary payments" });
    }
  });

  // Daily rewards system
  app.get("/api/rewards/daily", isAuthenticated, async (req, res) => {
    try {
      const reward = await storage.getCurrentDailyReward(req.user!.id);
      res.json(reward);
    } catch (err) {
      console.error("Error getting daily reward:", err);
      res.status(500).json({ error: "Failed to get daily reward" });
    }
  });

  app.get("/api/rewards/daily/history", isAuthenticated, async (req, res) => {
    try {
      const rewards = await storage.getDailyRewardsByUserId(req.user!.id);
      res.json(rewards);
    } catch (err) {
      console.error("Error getting daily rewards history:", err);
      res.status(500).json({ error: "Failed to get daily rewards history" });
    }
  });

  app.post("/api/rewards/daily/:id/claim", isAuthenticated, async (req, res) => {
    try {
      const rewardId = parseInt(req.params.id);
      const claimed = await storage.claimDailyReward(rewardId);
      res.json({
        success: true,
        claimed
      });
    } catch (err) {
      if (err instanceof Error) {
        res.status(400).send(err.message);
      } else {
        res.status(400).send("Failed to claim daily reward");
      }
    }
  });

  // Active boosts
  app.get("/api/boosts", isAuthenticated, async (req, res) => {
    try {
      const boosts = await storage.getActiveBoostsByUserId(req.user!.id);
      const eggMultiplier = await storage.getActiveEggBoost(req.user!.id);
      res.json({
        boosts,
        eggMultiplier
      });
    } catch (err) {
      console.error("Error getting active boosts:", err);
      res.status(500).json({ error: "Failed to get active boosts" });
    }
  });

  // Update existing recharge endpoint to handle referral commissions
  app.post("/api/wallet/recharge/complete", isAuthenticated, async (req, res) => {
    const schema = z.object({
      transactionId: z.string(),
    });

    const result = schema.safeParse(req.body);
    if (!result.success) return res.status(400).json(result.error);

    try {
      const transaction = await storage.getTransactionByTransactionId(result.data.transactionId);
      if (!transaction) {
        return res.status(404).send("Transaction not found");
      }

      // Update transaction status
      await storage.updateTransactionStatus(result.data.transactionId, "completed");

      // Get user's transactions to check if this is first deposit
      const userTransactions = await storage.getTransactionsByUserId(req.user!.id);
      const previousDeposits = userTransactions.filter(t => t.type === "recharge" && t.status === "completed");
      const isFirstDeposit = previousDeposits.length === 0;

      // Calculate deposit amount with potential bonus
      let finalAmount = parseFloat(transaction.amount);
      let bonusAmount = 0;

      // Apply 10% first deposit bonus only after admin confirmation
      if (isFirstDeposit) {
        bonusAmount = finalAmount * 0.1; // 10% bonus
        finalAmount += bonusAmount;

        // Create bonus transaction
        await storage.createTransaction(
          req.user!.id,
          "bonus",
          bonusAmount,
          `bonus-${transaction.transactionId}`,
          undefined,
          JSON.stringify({ reason: "First deposit bonus" })
        );

        // Immediately approve and apply the bonus
        await storage.updateTransactionStatus(`bonus-${transaction.transactionId}`, "completed");
        await storage.updateUserBalance(req.user!.id, bonusAmount);
      }

      // Update user's balance with original amount
      await storage.updateUserBalance(req.user!.id, parseFloat(transaction.amount));

      // Process referral commissions if user was referred
      const user = await storage.getUser(req.user!.id);
      if (user && user.referredBy) {
        try {
          // Find the referrer
          const referrer = await storage.getUserByReferralCode(user.referredBy);
          if (referrer) {
            // Calculate level 1 commission (10% of deposit)
            const level1Amount = parseFloat(transaction.amount) * 0.1;

            // Create earnings record
            await storage.createReferralEarning({
              userId: referrer.id,
              referredUserId: req.user!.id,
              level: 1,
              amount: level1Amount.toFixed(2),
              claimed: false
            });

            // Update referrer's total earnings
            await storage.updateUserReferralEarnings(referrer.id, level1Amount);
            await storage.updateUserTeamEarnings(referrer.id, level1Amount);

            // Process higher level referrals (up to 6 levels)
            let currentReferrer = referrer;

            for (let level = 2; level <= 6; level++) {
              if (!currentReferrer.referredBy) break;

              // Find the next level referrer
              const nextReferrer = await storage.getUserByReferralCode(currentReferrer.referredBy);
              if (!nextReferrer) break;

              // Get commission rate for this level
              let commissionRate = 0;
              switch (level) {
                case 2: commissionRate = 0.06; break; // 6% for level 2
                case 3: commissionRate = 0.04; break; // 4% for level 3
                case 4: commissionRate = 0.03; break; // 3% for level 4
                case 5: commissionRate = 0.02; break; // 2% for level 5
                case 6: commissionRate = 0.01; break; // 1% for level 6
              }

              // Calculate commission amount
              const commissionAmount = parseFloat(transaction.amount) * commissionRate;

              // Create earnings record
              await storage.createReferralEarning({
                userId: nextReferrer.id,
                referredUserId: req.user!.id,
                level,
                amount: commissionAmount.toFixed(2),
                claimed: false
              });

              // Update referrer's total earnings
              await storage.updateUserReferralEarnings(nextReferrer.id, commissionAmount);
              await storage.updateUserTeamEarnings(nextReferrer.id, commissionAmount);

              // Move to next level referrer
              currentReferrer = nextReferrer;
            }
          }
        } catch (referralError) {
          console.error("Error processing referral commissions:", referralError);
          // Continue execution - don't fail the deposit because of referral issues
        }
      }

      res.json({
        success: true,
        isFirstDeposit,
        bonusAmount,
        totalAmount: finalAmount
      });
    } catch (err) {
      if (err instanceof Error) {
        res.status(400).send(err.message);
      } else {
        res.status(400).send("Failed to complete recharge");
      }
    }
  });

  // Spin System Routes
  app.get("/api/spin/status", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).send("User not found");
      }

      // Calculate time until next free spin
      const lastSpinTime = user.lastSpinAt ? new Date(user.lastSpinAt) : null;
      const now = new Date();
      const nextMidnightUTC = new Date(now);
      nextMidnightUTC.setUTCHours(24, 0, 0, 0);

      const canSpinDaily = !lastSpinTime || lastSpinTime < new Date(now.setUTCHours(0, 0, 0, 0));
      const timeUntilNextSpin = canSpinDaily ? 0 : nextMidnightUTC.getTime() - now.getTime();

      res.json({
        canSpinDaily,
        timeUntilNextSpin,
        extraSpinsAvailable: user.extraSpinsAvailable || 0
      });
    } catch (err) {
      console.error("Error getting spin status:", err);
      res.status(500).json({ error: "Failed to get spin status" });
    }
  });

  app.post("/api/spin/daily", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).send("User not found");
      }

      // Check if user has a free spin available
      const now = new Date();
      const lastSpinTime = user.lastSpinAt ? new Date(user.lastSpinAt) : null;
      const canSpinDaily = !lastSpinTime || lastSpinTime < new Date(now.setUTCHours(0, 0, 0, 0));

      if (!canSpinDaily && user.extraSpinsAvailable === 0) {
        return res.status(400).send("No spins available");
      }

      // Randomly select a reward based on probabilities
      const totalProbability = dailySpinRewards.reduce((sum, reward) => sum + reward.probability, 0);
      let random = Math.random() * totalProbability;
      let selectedReward = dailySpinRewards[0];

      for (const reward of dailySpinRewards) {
        random -= reward.probability;
        if (random <= 0) {
          selectedReward = reward;
          break;
        }
      }

      // Record spin history
      const spinRecord = await storage.createSpinHistory({
        userId: req.user!.id,
        spinType: "daily",
        rewardType: selectedReward.reward.type,
        rewardAmount: selectedReward.reward.amount.toString(), // Convert to string for decimal type
        chickenType: selectedReward.reward.chickenType
      });

      // Apply the reward
      switch (selectedReward.reward.type) {
        case "eggs": {
          const resources = await storage.getResourcesByUserId(req.user!.id);
          await storage.updateResources(req.user!.id, {
            eggs: resources.eggs + selectedReward.reward.amount
          });
          break;
        }
        case "wheat": {
          const resources = await storage.getResourcesByUserId(req.user!.id);
          await storage.updateResources(req.user!.id, {
            wheatBags: resources.wheatBags + selectedReward.reward.amount
          });
          break;
        }
        case "water": {
          const resources = await storage.getResourcesByUserId(req.user!.id);
          await storage.updateResources(req.user!.id, {
            waterBuckets: resources.waterBuckets + selectedReward.reward.amount
          });
          break;
        }
        case "usdt": {
          await storage.updateUserBalance(req.user!.id, selectedReward.reward.amount);
          break;
        }
        case "extra_spin": {
          await storage.updateUserExtraSpins(req.user!.id, user.extraSpinsAvailable + selectedReward.reward.amount);
          break;
        }
      }

      // Update last spin time if it was a free spin
      if (canSpinDaily) {
        await storage.updateUserLastSpin(req.user!.id);
      } else {
        // Deduct an extra spin
        await storage.updateUserExtraSpins(req.user!.id, user.extraSpinsAvailable - 1);
      }

      res.json({
        success: true,
        reward: selectedReward.reward,
        spinRecord
      });
    } catch (err) {
      console.error("Error processing daily spin:", err);
      if (err instanceof Error) {
        res.status(400).send(err.message);
      } else {
        res.status(400).send("Failed to process daily spin");
      }
    }
  });

  app.post("/api/spin/super", isAuthenticated, async (req, res) => {
    try {
      const SUPER_SPIN_COST = 10; // 10 USDT per super spin

      // Check if user has enough USDT
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).send("User not found");
      }

      if (parseFloat(user.usdtBalance) < SUPER_SPIN_COST) {
        return res.status(400).send("Insufficient USDT balance");
      }

      // Deduct USDT cost
      await storage.updateUserBalance(req.user!.id, -SUPER_SPIN_COST);

      // Select reward using weighted probability
      const totalProbability = superJackpotRewards.reduce((sum, reward) => sum + reward.probability, 0);
      let random = Math.random() * totalProbability;
      let selectedReward = superJackpotRewards[0];

      for (const reward of superJackpotRewards) {
        random -= reward.probability;
        if (random <= 0) {
          selectedReward = reward;
          break;
        }
      }

      // Record spin history
      const spinRecord = await storage.createSpinHistory({
        userId: req.user!.id,
        spinType: "super",
        rewardType: selectedReward.reward.type,
        rewardAmount: selectedReward.reward.amount.toString(), // Convert to string for decimal type
        chickenType: selectedReward.reward.chickenType
      });

      // Apply the reward
      switch (selectedReward.reward.type) {
        case "eggs": {
          const resources = await storage.getResourcesByUserId(req.user!.id);
          await storage.updateResources(req.user!.id, {
            eggs: resources.eggs + selectedReward.reward.amount
          });
          break;
        }
        case "usdt": {
          await storage.updateUserBalance(req.user!.id, selectedReward.reward.amount);
          break;
        }
        case "chicken": {
          if (selectedReward.reward.chickenType) {
            await storage.createChicken(req.user!.id, selectedReward.reward.chickenType);
            // If it's the special golden chicken + USDT combo
            if (selectedReward.reward.amount > 1) {
              await storage.updateUserBalance(req.user!.id, 50); // 50 USDT bonus
            }
          }
          break;
        }
      }

      res.json({
        success: true,
        reward: selectedReward.reward,
        spinRecord
      });
    } catch (err) {
      console.error("Error processing super spin:", err);
      if (err instanceof Error) {
        res.status(400).send(err.message);
      } else {
        res.status(400).send("Failed to process super spin");
      }
    }
  });

  app.get("/api/spin/history", isAuthenticated, async (req, res) => {
    try {
      const history = await storage.getSpinHistoryByUserId(req.user!.id);
      res.json(history);
    } catch (err) {
      console.error("Error getting spin history:", err);
      res.status(500).json({ error: "Failed to get spin history" });
    }
  });

  app.post("/api/spin/buy", isAuthenticated, async (req, res) => {
    try {
      const EXTRA_SPIN_COST = 2; // 2 USDT per extra spin

      const schema = z.object({
        quantity: z.number().positive()
      });

      const result = schema.safeParse(req.body);
      if (!result.success) return res.status(400).json(result.error);

      const totalCost = EXTRA_SPIN_COST * result.data.quantity;

      // Check if user has enough USDT
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).send("User not found");
      }

      if (parseFloat(user.usdtBalance) < totalCost) {
        return res.status(400).send("Insufficient USDT balance");
      }

      // Deduct USDT and add extra spins
      await storage.updateUserBalance(req.user!.id, -totalCost);
      await storage.updateUserExtraSpins(req.user!.id, (user.extraSpinsAvailable || 0) + result.data.quantity);

      res.json({
        success: true,
        extraSpinsAdded: result.data.quantity,
        totalCost
      });
    } catch (err) {
      console.error("Error buying extra spins:", err);
      if (err instanceof Error) {
        res.status(400).send(err.message);
      } else {
        res.status(400).send("Failed to buy extra spins");
      }
    }
  });

  // Tutorial routes
  app.get("/api/tutorial/status", isAuthenticated, async (req, res) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const userProfile = await storage.getUserProfile(req.user.id);
      if (!userProfile) {
        return res.status(404).json({ error: "User profile not found" });
      }
      
      res.json({
        tutorialStep: userProfile.tutorialStep,
        tutorialCompleted: userProfile.tutorialCompleted,
        tutorialDisabled: userProfile.tutorialDisabled
      });
    } catch (err) {
      console.error("Error fetching tutorial status:", err);
      res.status(500).json({ error: "Failed to fetch tutorial status" });
    }
  });
  
  app.post("/api/tutorial/update-step", isAuthenticated, async (req, res) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const { step } = req.body;
      if (typeof step !== "number" || step < 0) {
        return res.status(400).json({ error: "Invalid tutorial step" });
      }
      
      const updatedProfile = await storage.updateTutorialProgress(req.user.id, step);
      res.json({
        tutorialStep: updatedProfile.tutorialStep,
        tutorialCompleted: updatedProfile.tutorialCompleted,
        tutorialDisabled: updatedProfile.tutorialDisabled
      });
    } catch (err) {
      console.error("Error updating tutorial step:", err);
      res.status(500).json({ error: "Failed to update tutorial step" });
    }
  });
  
  app.post("/api/tutorial/complete", isAuthenticated, async (req, res) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const updatedProfile = await storage.completeTutorial(req.user.id);
      res.json({
        tutorialStep: updatedProfile.tutorialStep,
        tutorialCompleted: updatedProfile.tutorialCompleted,
        tutorialDisabled: updatedProfile.tutorialDisabled
      });
    } catch (err) {
      console.error("Error completing tutorial:", err);
      res.status(500).json({ error: "Failed to complete tutorial" });
    }
  });
  
  app.post("/api/tutorial/disable", isAuthenticated, async (req, res) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const updatedProfile = await storage.disableTutorial(req.user.id);
      res.json({
        tutorialStep: updatedProfile.tutorialStep,
        tutorialCompleted: updatedProfile.tutorialCompleted,
        tutorialDisabled: updatedProfile.tutorialDisabled
      });
    } catch (err) {
      console.error("Error disabling tutorial:", err);
      res.status(500).json({ error: "Failed to disable tutorial" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}