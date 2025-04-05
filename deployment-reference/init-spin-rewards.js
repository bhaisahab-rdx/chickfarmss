// Script to initialize spin rewards in the database
const fs = require('fs');
const { execSync } = require('child_process');
const { Client } = require('pg');

// Database configuration from environment
const dbUrl = process.env.DATABASE_URL;
const client = new Client({
  connectionString: dbUrl,
});

const connectToDatabase = async () => {
  try {
    await client.connect();
    console.log("Connected to database successfully");
    return true;
  } catch (error) {
    console.error("Failed to connect to database:", error);
    return false;
  }
};

// Function to extract spin rewards from schema.ts
const extractSpinRewards = () => {
  try {
    const schemaContent = fs.readFileSync('./shared/schema.ts', 'utf8');
    
    // Extract daily spin rewards
    const dailyRewardsMatch = schemaContent.match(/export const dailySpinRewards: SpinRewardType\[\] = \[([\s\S]*?)\];/);
    const dailyRewardsString = dailyRewardsMatch ? dailyRewardsMatch[1] : '';
    
    // Extract super jackpot rewards
    const superRewardsMatch = schemaContent.match(/export const superJackpotRewards: SpinRewardType\[\] = \[([\s\S]*?)\];/);
    const superRewardsString = superRewardsMatch ? superRewardsMatch[1] : '';
    
    // Parse daily rewards
    const dailyRewards = [];
    const dailyRewardItems = dailyRewardsString.split('},');
    dailyRewardItems.forEach(item => {
      if (item.trim()) {
        try {
          const rewardTypeMatch = item.match(/type: "(.*?)"/);
          const rewardType = rewardTypeMatch ? rewardTypeMatch[1] : '';
          
          const amountMatch = item.match(/amount: ([\d.]+)/);
          const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;
          
          const probabilityMatch = item.match(/probability: ([\d.]+)/);
          const probability = probabilityMatch ? parseFloat(probabilityMatch[1]) : 0;
          
          const chickenTypeMatch = item.match(/chickenType: "(.*?)"/);
          const chickenType = chickenTypeMatch ? chickenTypeMatch[1] : null;
          
          dailyRewards.push({
            spinType: 'daily',
            rewardType,
            amount,
            chickenType,
            probability
          });
        } catch (err) {
          console.error('Error parsing daily reward item:', err);
        }
      }
    });
    
    // Parse super jackpot rewards
    const superRewards = [];
    const superRewardItems = superRewardsString.split('},');
    superRewardItems.forEach(item => {
      if (item.trim()) {
        try {
          const rewardTypeMatch = item.match(/type: "(.*?)"/);
          const rewardType = rewardTypeMatch ? rewardTypeMatch[1] : '';
          
          const amountMatch = item.match(/amount: ([\d.]+)/);
          const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;
          
          const probabilityMatch = item.match(/probability: ([\d.]+)/);
          const probability = probabilityMatch ? parseFloat(probabilityMatch[1]) : 0;
          
          const chickenTypeMatch = item.match(/chickenType: "(.*?)"/);
          const chickenType = chickenTypeMatch ? chickenTypeMatch[1] : null;
          
          superRewards.push({
            spinType: 'super',
            rewardType,
            amount,
            chickenType,
            probability
          });
        } catch (err) {
          console.error('Error parsing super reward item:', err);
        }
      }
    });
    
    return { dailyRewards, superRewards };
  } catch (error) {
    console.error("Failed to extract spin rewards:", error);
    return { dailyRewards: [], superRewards: [] };
  }
};

// Function to insert spin rewards into the database
const insertSpinRewards = async (rewards) => {
  try {
    // Start a transaction
    await client.query('BEGIN');
    
    // Clear existing spin rewards
    await client.query('TRUNCATE TABLE "spin_rewards"');
    
    // Insert each reward
    let insertCount = 0;
    for (const reward of rewards) {
      const { spinType, rewardType, amount, chickenType, probability } = reward;
      const query = `
        INSERT INTO "spin_rewards" ("spinType", "rewardType", "amount", "chickenType", "probability")
        VALUES ($1, $2, $3, $4, $5)
      `;
      await client.query(query, [spinType, rewardType, amount, chickenType, probability]);
      insertCount++;
    }
    
    // Commit the transaction
    await client.query('COMMIT');
    console.log(`Successfully inserted ${insertCount} spin rewards`);
    return true;
  } catch (error) {
    // Rollback the transaction in case of error
    await client.query('ROLLBACK');
    console.error("Failed to insert spin rewards:", error);
    return false;
  }
};

// Main function to initialize spin rewards
const initializeSpinRewards = async () => {
  try {
    // Connect to the database
    const connected = await connectToDatabase();
    if (!connected) {
      console.error("Cannot proceed without database connection");
      return;
    }
    
    // Extract spin rewards from schema
    const { dailyRewards, superRewards } = extractSpinRewards();
    console.log(`Extracted ${dailyRewards.length} daily rewards and ${superRewards.length} super rewards`);
    
    // Insert all rewards into the database
    const allRewards = [...dailyRewards, ...superRewards];
    if (allRewards.length === 0) {
      console.error("No rewards to insert");
      return;
    }
    
    const inserted = await insertSpinRewards(allRewards);
    if (inserted) {
      console.log("Spin rewards initialized successfully");
    } else {
      console.error("Failed to initialize spin rewards");
    }
  } catch (error) {
    console.error("Error initializing spin rewards:", error);
  } finally {
    // Close the database connection
    await client.end();
  }
};

// Run the initialization
initializeSpinRewards();