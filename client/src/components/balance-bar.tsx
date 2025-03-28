import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Resource } from "@shared/schema";
import { motion } from "framer-motion";
import React, { useState } from "react";
import { useUIState } from "@/hooks/use-ui-state";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function BalanceBar() {
  const { user } = useAuth();
  const { hideUIElements } = useUIState();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  const resourcesQuery = useQuery<Resource>({
    queryKey: ["/api/resources"],
    staleTime: 0, // Always fetch fresh data
    retry: 2, // Retry failed requests twice
  });

  // Click handlers for resource buttons
  const handleWaterClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setLocation('/shop?tab=water');
    toast({
      title: "Water Buckets",
      description: "Get water buckets to keep your chickens healthy!",
      duration: 3000,
    });
  };

  const handleWheatClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setLocation('/shop?tab=wheat');
    toast({
      title: "Wheat Bags",
      description: "Buy wheat to feed your chickens!",
      duration: 3000,
    });
  };

  const handleEggsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setLocation('/home');
    toast({
      title: "Eggs Production",
      description: "Your chickens produce eggs over time. Feed them to get more eggs!",
      duration: 3000,
    });
  };

  const handleUsdtClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setLocation('/wallet');
    toast({
      title: "Add USDT",
      description: "Deposit USDT to purchase resources and chickens!",
      duration: 3000,
    });
  };

  // Hide when loading, no user, error, or when spin wheel is open
  if (!user || resourcesQuery.isLoading || resourcesQuery.error || hideUIElements) {
    return null;
  }

  const resources = resourcesQuery.data || { waterBuckets: 0, wheatBags: 0, eggs: 0 };

  return (
    <div className="fixed top-0 left-0 right-0 z-30 bg-transparent">
      <motion.div
        className="township-resource-bar max-w-4xl mx-auto overflow-hidden my-1 sm:my-2 px-1 sm:px-3"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        style={{
          background: "linear-gradient(to bottom, rgba(255, 165, 61, 0.95), rgba(255, 124, 46, 0.9))",
          borderRadius: "12px",
          boxShadow: "0 6px 12px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.08)",
          display: "flex",
          padding: "6px 4px 6px 4px",
          border: "2px solid rgba(255, 208, 91, 0.7)",
          position: "relative",
          overflow: "hidden"
        }}
      >
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -right-2 -top-2 w-12 h-12 bg-white/10 rounded-full blur-md" />
          <div className="absolute -left-2 -bottom-2 w-10 h-10 bg-white/10 rounded-full blur-md" />
          <div className="absolute top-1/2 -translate-y-1/2 right-6 w-2 h-2 bg-white/30 rounded-full" />
          <div className="absolute top-1/3 -translate-y-1/2 left-10 w-2 h-2 bg-white/20 rounded-full" />
        </div>

        {/* Water */}
        <motion.div 
          className="township-resource-item flex-1 mx-0.5 sm:mx-1 relative"
          initial={{ 
            background: "rgba(255, 255, 255, 0.95)",
            borderRadius: "10px",
            padding: "4px 5px 4px 5px",
            border: "1px solid rgba(3, 169, 244, 0.3)",
            boxShadow: "0 2px 4px rgba(0,0,0,0.08), inset 0 1px 2px rgba(255, 255, 255, 0.5)",
            minWidth: 0,
            zIndex: 1
          }}
          whileHover={{ 
            scale: 1.05,
            background: "rgba(229, 246, 253, 0.95)",
            boxShadow: "0 4px 8px rgba(0,0,0,0.12), inset 0 1px 3px rgba(41, 182, 246, 0.4)",
            border: "1px solid rgba(3, 169, 244, 0.6)"
          }}
          transition={{ 
            type: "spring", 
            stiffness: 400, 
            damping: 10 
          }}
        >
          <div className="flex items-center">
            <motion.div
              className="flex-shrink-0 mr-2 p-1.5 rounded-full"
              initial={{
                background: "linear-gradient(135deg, rgba(41, 182, 246, 0.15), rgba(255,255,255,0.7))",
                boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)"
              }}
              whileHover={{
                background: "linear-gradient(135deg, rgba(41, 182, 246, 0.3), rgba(255,255,255,0.9))",
                boxShadow: "inset 0 1px 3px rgba(41, 182, 246, 0.4)"
              }}
            >
              <motion.div
                whileHover={{ rotate: 10, scale: 1.1 }}
                transition={{ type: "spring", stiffness: 500 }}
              >
                <img src="/assets/waterbucket.png" alt="Water" width="30" height="30" style={{ objectFit: "contain" }} />
              </motion.div>
            </motion.div>
            <div className="min-w-0 flex-grow">
              <div className="text-[10px] whitespace-nowrap font-semibold" style={{ color: "#01579B" }}>
                Water
              </div>
              <motion.div 
                className="text-sm font-bold truncate" 
                style={{ color: "#01579B" }}
                whileHover={{ scale: 1.05 }}
              >
                {resources.waterBuckets}
              </motion.div>
            </div>
            <motion.button
              onClick={handleWaterClick}
              className="ml-1 w-6 h-6 flex-shrink-0 rounded-full flex items-center justify-center cursor-pointer"
              style={{
                background: "linear-gradient(to bottom, #29B6F6, #29B6F6dd)",
                boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                border: "none"
              }}
              whileHover={{ 
                scale: 1.2, 
                rotate: 5,
                boxShadow: "0 3px 6px rgba(0,0,0,0.2)" 
              }}
              whileTap={{ scale: 0.9 }}
            >
              <span className="text-white font-bold text-xs">+</span>
            </motion.button>
          </div>

          <motion.div 
            className="absolute inset-0 rounded-lg opacity-0"
            initial={{ opacity: 0 }}
            whileHover={{ 
              opacity: 0.1,
              background: "radial-gradient(circle at center, rgba(3, 169, 244, 0.4) 0%, rgba(3, 169, 244, 0) 70%)"
            }}
            transition={{ duration: 0.3 }}
          />
        </motion.div>

        {/* Wheat */}
        <motion.div 
          className="township-resource-item flex-1 mx-0.5 sm:mx-1 relative"
          initial={{ 
            background: "rgba(255, 255, 255, 0.95)",
            borderRadius: "10px",
            padding: "4px 5px 4px 5px",
            border: "1px solid rgba(255, 193, 7, 0.3)",
            boxShadow: "0 2px 4px rgba(0,0,0,0.08), inset 0 1px 2px rgba(255, 255, 255, 0.5)",
            minWidth: 0,
            zIndex: 1
          }}
          whileHover={{ 
            scale: 1.05,
            background: "rgba(255, 248, 225, 0.95)",
            boxShadow: "0 4px 8px rgba(0,0,0,0.12), inset 0 1px 3px rgba(255, 193, 7, 0.4)",
            border: "1px solid rgba(255, 193, 7, 0.6)"
          }}
          transition={{ 
            type: "spring", 
            stiffness: 400, 
            damping: 10 
          }}
        >
          <div className="flex items-center">
            <motion.div
              className="flex-shrink-0 mr-2 p-1.5 rounded-full"
              initial={{
                background: "linear-gradient(135deg, rgba(255, 193, 7, 0.15), rgba(255,255,255,0.7))",
                boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)"
              }}
              whileHover={{
                background: "linear-gradient(135deg, rgba(255, 193, 7, 0.3), rgba(255,255,255,0.9))",
                boxShadow: "inset 0 1px 3px rgba(255, 193, 7, 0.4)"
              }}
            >
              <motion.div
                whileHover={{ rotate: -10, scale: 1.1 }}
                transition={{ type: "spring", stiffness: 500 }}
              >
                <img src="/assets/wheatbag.png" alt="Wheat" width="30" height="30" style={{ objectFit: "contain" }} />
              </motion.div>
            </motion.div>
            <div className="min-w-0 flex-grow">
              <div className="text-[10px] whitespace-nowrap font-semibold" style={{ color: "#FF6F00" }}>
                Wheat
              </div>
              <motion.div 
                className="text-sm font-bold truncate" 
                style={{ color: "#FF6F00" }}
                whileHover={{ scale: 1.05 }}
              >
                {resources.wheatBags}
              </motion.div>
            </div>
            <motion.button
              onClick={handleWheatClick}
              className="ml-1 w-6 h-6 flex-shrink-0 rounded-full flex items-center justify-center cursor-pointer"
              style={{
                background: "linear-gradient(to bottom, #FFC107, #FFC107dd)",
                boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                border: "none"
              }}
              whileHover={{ 
                scale: 1.2, 
                rotate: 5,
                boxShadow: "0 3px 6px rgba(0,0,0,0.2)" 
              }}
              whileTap={{ scale: 0.9 }}
            >
              <span className="text-white font-bold text-xs">+</span>
            </motion.button>
          </div>

          <motion.div 
            className="absolute inset-0 rounded-lg opacity-0"
            initial={{ opacity: 0 }}
            whileHover={{ 
              opacity: 0.1,
              background: "radial-gradient(circle at center, rgba(255, 193, 7, 0.4) 0%, rgba(255, 193, 7, 0) 70%)"
            }}
            transition={{ duration: 0.3 }}
          />
        </motion.div>

        {/* Eggs */}
        <motion.div 
          className="township-resource-item flex-1 mx-0.5 sm:mx-1 relative"
          initial={{ 
            background: "rgba(255, 255, 255, 0.95)",
            borderRadius: "10px",
            padding: "4px 5px 4px 5px",
            border: "1px solid rgba(255, 183, 77, 0.3)",
            boxShadow: "0 2px 4px rgba(0,0,0,0.08), inset 0 1px 2px rgba(255, 255, 255, 0.5)",
            minWidth: 0,
            zIndex: 1
          }}
          whileHover={{ 
            scale: 1.05,
            background: "rgba(255, 243, 224, 0.95)",
            boxShadow: "0 4px 8px rgba(0,0,0,0.12), inset 0 1px 3px rgba(255, 183, 77, 0.4)",
            border: "1px solid rgba(255, 183, 77, 0.6)"
          }}
          transition={{ 
            type: "spring", 
            stiffness: 400, 
            damping: 10 
          }}
        >
          <div className="flex items-center">
            <motion.div
              className="flex-shrink-0 mr-2 p-1.5 rounded-full"
              initial={{
                background: "linear-gradient(135deg, rgba(255, 183, 77, 0.15), rgba(255,255,255,0.7))",
                boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)"
              }}
              whileHover={{
                background: "linear-gradient(135deg, rgba(255, 183, 77, 0.3), rgba(255,255,255,0.9))",
                boxShadow: "inset 0 1px 3px rgba(255, 183, 77, 0.4)"
              }}
            >
              <motion.div
                whileHover={{ 
                  scale: 1.1,
                  y: [0, -3, 0],
                  transition: { y: { repeat: Infinity, repeatType: "mirror", duration: 0.5 } }
                }}
              >
                <img src="/assets/egg.png" alt="Eggs" width="30" height="30" style={{ objectFit: "contain" }} />
              </motion.div>
            </motion.div>
            <div className="min-w-0 flex-grow">
              <div className="text-[10px] whitespace-nowrap font-semibold" style={{ color: "#E65100" }}>
                Eggs
              </div>
              <motion.div 
                className="text-sm font-bold truncate" 
                style={{ color: "#E65100" }}
                whileHover={{ scale: 1.05 }}
              >
                {resources.eggs}
              </motion.div>
            </div>
            <motion.button
              onClick={handleEggsClick}
              className="ml-1 w-6 h-6 flex-shrink-0 rounded-full flex items-center justify-center cursor-pointer"
              style={{
                background: "linear-gradient(to bottom, #FFB74D, #FFB74Ddd)",
                boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                border: "none"
              }}
              whileHover={{ 
                scale: 1.2, 
                rotate: 5,
                boxShadow: "0 3px 6px rgba(0,0,0,0.2)" 
              }}
              whileTap={{ scale: 0.9 }}
            >
              <span className="text-white font-bold text-xs">+</span>
            </motion.button>
          </div>

          <motion.div 
            className="absolute inset-0 rounded-lg opacity-0"
            initial={{ opacity: 0 }}
            whileHover={{ 
              opacity: 0.1,
              background: "radial-gradient(circle at center, rgba(255, 183, 77, 0.4) 0%, rgba(255, 183, 77, 0) 70%)"
            }}
            transition={{ duration: 0.3 }}
          />
        </motion.div>

        {/* USDT */}
        <motion.div 
          className="township-resource-item flex-1 mx-0.5 sm:mx-1 relative"
          initial={{ 
            background: "rgba(255, 255, 255, 0.95)",
            borderRadius: "10px",
            padding: "4px 5px 4px 5px",
            border: "1px solid rgba(38, 161, 123, 0.3)",
            boxShadow: "0 2px 4px rgba(0,0,0,0.08), inset 0 1px 2px rgba(255, 255, 255, 0.5)",
            minWidth: 0,
            zIndex: 1
          }}
          whileHover={{ 
            scale: 1.05,
            background: "rgba(232, 245, 233, 0.95)",
            boxShadow: "0 4px 8px rgba(0,0,0,0.12), inset 0 1px 3px rgba(38, 161, 123, 0.4)",
            border: "1px solid rgba(38, 161, 123, 0.6)"
          }}
          transition={{ 
            type: "spring", 
            stiffness: 400, 
            damping: 10 
          }}
        >
          <div className="flex items-center">
            <motion.div
              className="flex-shrink-0 mr-2 p-1.5 rounded-full"
              initial={{
                background: "linear-gradient(135deg, rgba(38, 161, 123, 0.15), rgba(255,255,255,0.7))",
                boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)"
              }}
              whileHover={{
                background: "linear-gradient(135deg, rgba(38, 161, 123, 0.3), rgba(255,255,255,0.9))",
                boxShadow: "inset 0 1px 3px rgba(38, 161, 123, 0.4)",
                rotate: [0, 5, -5, 0],
                transition: { rotate: { duration: 0.5 } }
              }}
            >
              <motion.div
                whileHover={{ 
                  rotate: [0, 360],
                  transition: { rotate: { duration: 0.8 } }
                }}
              >
                <img src="/assets/tether-usdt-logo.png" alt="USDT" width="30" height="30" style={{ objectFit: "contain" }} />
              </motion.div>
            </motion.div>
            <div className="min-w-0 flex-grow">
              <div className="text-[10px] whitespace-nowrap font-semibold" style={{ color: "#1A5E45" }}>
                USDT
              </div>
              <motion.div 
                className="text-sm font-bold truncate" 
                style={{ color: "#1A5E45" }}
                whileHover={{ 
                  scale: 1.05, 
                  color: ["#1A5E45", "#26A17B", "#1A5E45"],
                  transition: { color: { duration: 1, repeat: Infinity } }
                }}
              >
                ${user.usdtBalance}
              </motion.div>
            </div>
            <motion.button
              onClick={handleUsdtClick}
              className="ml-1 w-6 h-6 flex-shrink-0 rounded-full flex items-center justify-center cursor-pointer"
              style={{
                background: "linear-gradient(to bottom, #26A17B, #26A17Bdd)",
                boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                border: "none"
              }}
              whileHover={{ 
                scale: 1.2, 
                rotate: 5,
                boxShadow: "0 3px 6px rgba(0,0,0,0.2)" 
              }}
              whileTap={{ scale: 0.9 }}
            >
              <span className="text-white font-bold text-xs">+</span>
            </motion.button>
          </div>

          <motion.div 
            className="absolute inset-0 rounded-lg opacity-0"
            initial={{ opacity: 0 }}
            whileHover={{ 
              opacity: 0.1,
              background: "radial-gradient(circle at center, rgba(38, 161, 123, 0.4) 0%, rgba(38, 161, 123, 0) 70%)"
            }}
            transition={{ duration: 0.3 }}
          />
        </motion.div>
      </motion.div>
    </div>
  );
}