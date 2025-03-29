import type { Express } from "express";
import { isAuthenticated } from "./auth";
import { storage } from "./storage";
import { z } from "zod";
import { config } from "./config";
import { nowPaymentsService } from "./services/nowpayments";

// Helper functions to check configuration
const isNOWPaymentsConfigured = () => !!config.nowpayments.apiKey;
const isIPNSecretConfigured = () => !!config.nowpayments.ipnSecretKey;

export async function registerRoutes(app: Express): Promise<Express> {
  // Auth and health endpoints are already set up in main routes
  
  // NOWPayments API - check service status
  app.get("/api/payments/status", async (req, res) => {
    try {
      const status = await nowPaymentsService.getStatus();
      res.json({ 
        status, 
        apiKeyConfigured: isNOWPaymentsConfigured(),
        ipnSecretConfigured: isIPNSecretConfigured(),
        serviceConfigured: nowPaymentsService.isConfigured()
      });
    } catch (error) {
      console.error("Error checking NOWPayments status:", error);
      res.status(500).json({ error: "Failed to check payment service status" });
    }
  });
  
  // Public service status endpoint for payment popup
  app.get("/api/public/payments/service-status", async (req, res) => {
    try {
      let serviceStatus = "unknown";
      const apiConfigured = isNOWPaymentsConfigured();
      const ipnConfigured = isIPNSecretConfigured();
      let errorMessage = null;
      let minAmount = 10; // Default minimum amount
      
      console.log("[Payment Service Status] ========= START PAYMENT STATUS CHECK =========");
      console.log("[Payment Service Status] Checking NOWPayments configuration...");
      console.log("[Payment Service Status] API key configured:", apiConfigured ? "YES" : "NO");
      console.log("[Payment Service Status] IPN secret configured:", ipnConfigured ? "YES" : "NO");
      console.log("[Payment Service Status] Request origin:", req.headers.origin || 'Unknown');
      console.log("[Payment Service Status] User agent:", req.headers['user-agent'] || 'Unknown');
      
      if (apiConfigured) {
        try {
          console.log("[Payment Service Status] Calling NOWPayments status API...");
          const status = await nowPaymentsService.getStatus();
          
          console.log("[Payment Service Status] Raw status response:", status);
          
          if (status.status === 'error') {
            serviceStatus = "error";
            errorMessage = status.message || "Error connecting to payment service";
            console.error("[Payment Service Status] Error from status check:", errorMessage);
          } else {
            serviceStatus = status.status || "unknown";
            console.log("[Payment Service Status] Service status:", serviceStatus);
            
            // If we got a valid status, let's also try to get minimum amount
            if (serviceStatus !== "unknown" && serviceStatus !== "error") {
              try {
                console.log("[Payment Service Status] Getting minimum payment amount for USDTTRC20...");
                minAmount = await nowPaymentsService.getMinimumPaymentAmount("usdttrc20");
                console.log("[Payment Service Status] Minimum payment amount:", minAmount);
              } catch (minAmountError) {
                console.error("[Payment Service Status] Failed to get minimum amount:", minAmountError);
                // Not setting errorMessage here as the main status check was successful
              }
            }
          }
        } catch (error) {
          console.error("[Payment Service Status] Exception checking payment service:", error);
          serviceStatus = "error";
          errorMessage = error instanceof Error ? error.message : "Unknown error";
        }
      } else {
        console.log("[Payment Service Status] API key not configured, skipping status check");
      }
      
      // For NowPayments, we will consider the service ready if:
      // 1. API key is configured
      // 2. IPN secret is configured 
      // 3. Service status is not an explicit "error" (treat "unknown" as ok since the API returns OK as message)
      
      const isReady = apiConfigured && ipnConfigured && serviceStatus !== "error";
      
      console.log("[Payment Service Status] Service ready status:", isReady ? "READY" : "NOT READY");
      console.log("[Payment Service Status] ========= END PAYMENT STATUS CHECK =========");
      
      // Return a more detailed response to the client
      res.json({ 
        apiConfigured, 
        ipnConfigured, 
        serviceStatus,
        error: errorMessage,
        ready: isReady,
        minAmount: minAmount
      });
    } catch (error) {
      console.error("[Payment Service Status] Unexpected error:", error);
      res.status(500).json({ 
        error: "Failed to check payment service status",
        apiConfigured: isNOWPaymentsConfigured(),
        ipnConfigured: isIPNSecretConfigured(),
        serviceStatus: "error",
        ready: false
      });
    }
  });
  
  // Create a payment for authenticated users
  app.post("/api/payments/create-payment", isAuthenticated, async (req, res) => {
    try {
      const schema = z.object({
        amount: z.number().positive(),
        description: z.string().optional()
      });
      
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid request parameters", details: result.error });
      }

      const { amount, description = "ChickFarms USDT deposit" } = result.data;
      const user = req.user as any;
      
      console.log(`Creating NOWPayments payment for user ${user.id}, amount: ${amount} USDT`);
      
      if (!nowPaymentsService.isConfigured()) {
        return res.status(503).json({ 
          error: "Payment service not configured",
          message: "The payment service is not properly configured. Please try again later."
        });
      }
      
      try {
        // Create the payment using NOWPayments API
        const payment = await nowPaymentsService.createPayment(
          user.id,
          amount,
          description
        );
        
        console.log(`Created payment with ID ${payment.payment_id}, payment URL: ${payment.payment_url}`);
        
        // Create a transaction record
        const transaction = await storage.createTransaction(
          user.id,
          "deposit",
          amount,
          payment.payment_id,
          0,
          JSON.stringify(payment)
        );
        
        console.log(`Created transaction record with ID ${transaction.id}`);
        
        // Return the payment details to the client
        return res.json({
          success: true,
          payment: {
            id: payment.payment_id,
            status: payment.payment_status,
            paymentUrl: payment.payment_url,
            amount: amount,
            currency: "USDT",
            transactionId: transaction.id
          }
        });
      } catch (apiError: any) {
        console.error("Error creating NOWPayments payment:", apiError);
        return res.status(500).json({ 
          error: "Failed to create payment",
          message: apiError.message || "An error occurred while creating the payment" 
        });
      }
    } catch (error: any) {
      console.error("Unexpected error in payment creation endpoint:", error);
      res.status(500).json({ 
        error: "Failed to create payment",
        message: error.message || "An unexpected error occurred" 
      });
    }
  });
  
  // Handle Instant Payment Notification (IPN) callbacks from NOWPayments
  app.post("/api/ipn/nowpayments", async (req, res) => {
    try {
      console.log("[IPN] Received NOWPayments IPN callback");
      
      // Check if IPN secret is configured
      if (!isIPNSecretConfigured()) {
        console.error("[IPN] IPN secret key not configured");
        return res.status(503).json({ error: "IPN secret not configured" });
      }
      
      // Verify signature
      const signature = req.headers['x-nowpayments-sig'] as string;
      if (!signature) {
        console.error("[IPN] Missing signature header");
        return res.status(400).json({ error: "Missing signature" });
      }
      
      // Get the raw body
      const rawBody = JSON.stringify(req.body);
      console.log("[IPN] Raw body:", rawBody);
      
      // Verify the signature
      const isValid = nowPaymentsService.verifyIPNSignature(rawBody, signature);
      if (!isValid) {
        console.error("[IPN] Invalid signature");
        return res.status(403).json({ error: "Invalid signature" });
      }
      
      console.log("[IPN] Signature verified successfully");
      
      // Process the IPN
      const result = await nowPaymentsService.processIPNNotification(req.body);
      
      console.log("[IPN] IPN processed successfully:", result);
      
      // Return 200 OK to acknowledge receipt
      return res.status(200).json({ status: "ok" });
    } catch (error: any) {
      console.error("[IPN] Error processing IPN:", error);
      // Always return 200 OK to avoid NOWPayments retrying
      return res.status(200).json({ 
        status: "error",
        message: error.message || "An error occurred while processing the IPN"
      });
    }
  });
  
  // Endpoint to check payment status
  app.get("/api/payments/status/:paymentId", isAuthenticated, async (req, res) => {
    try {
      const { paymentId } = req.params;
      const user = req.user as any;
      
      // Find the transaction
      const transaction = await storage.getTransactionByTransactionId(paymentId);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      
      // Verify the transaction belongs to the user
      if (transaction.userId !== user.id && !(user as any).isAdmin) {
        return res.status(403).json({ error: "Not authorized to view this transaction" });
      }
      
      let paymentStatus;
      try {
        // Get payment status from NOWPayments API
        paymentStatus = await nowPaymentsService.getPaymentStatus(paymentId);
      } catch (apiError) {
        console.error(`Error fetching payment status for ${paymentId}:`, apiError);
        // Return the status based on our local transaction
        return res.json({
          success: true,
          payment: {
            id: transaction.transactionId,
            status: transaction.status,
            amount: transaction.amount,
            createdAt: transaction.createdAt
          }
        });
      }
      
      // Map the NOWPayments status to our own status
      const mappedStatus = nowPaymentsService.mapPaymentStatusToTransactionStatus(paymentStatus.payment_status);
      
      // Update our transaction if the status has changed
      if (mappedStatus !== transaction.status) {
        await storage.updateTransactionStatus(paymentId, mappedStatus);
        
        // If the payment is completed, update the user's balance
        if (mappedStatus === "completed" && transaction.status !== "completed") {
          await storage.updateUserBalance(user.id, parseFloat(transaction.amount));
          console.log(`Updated user ${user.id} balance with ${transaction.amount} USDT`);
        }
      }
      
      return res.json({
        success: true,
        payment: {
          id: paymentStatus.payment_id,
          status: paymentStatus.payment_status,
          mappedStatus: mappedStatus,
          amount: paymentStatus.price_amount,
          payAddress: paymentStatus.pay_address,
          createdAt: paymentStatus.created_at,
          updatedAt: paymentStatus.updated_at
        }
      });
    } catch (error: any) {
      console.error("Error checking payment status:", error);
      res.status(500).json({ 
        error: "Failed to check payment status",
        message: error.message || "An unexpected error occurred"
      });
    }
  });
  
  // Get available payment currencies
  app.get("/api/payments/currencies", async (req, res) => {
    try {
      const currencies = await nowPaymentsService.getAvailableCurrencies();
      res.json({ currencies });
    } catch (error) {
      console.error("Error fetching available currencies:", error);
      res.status(500).json({ error: "Failed to fetch available currencies" });
    }
  });

  // No need to create a new server, just use the existing one
  return app;
}