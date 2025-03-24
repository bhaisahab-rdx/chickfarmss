import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { dailySpinRewards, superJackpotRewards, type SpinRewardType } from "@shared/schema";
import { Loader2, Volume2, VolumeX } from "lucide-react";
import Confetti from "react-confetti";
import { useSoundEffect, useSoundToggle } from "@/hooks/use-sound-effects";

interface SpinWheelProps {
  onSpin: () => Promise<{
    reward: {
      type: string;
      amount: number;
      chickenType?: string;
    };
  }>;
  rewards: SpinRewardType[];
  isSpinning: boolean;
  spinType: "daily" | "super";
}

export function SpinWheel({ onSpin, rewards, isSpinning, spinType }: SpinWheelProps) {
  const [rotation, setRotation] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [currentReward, setCurrentReward] = useState<{ type: string; amount: number; chickenType?: string } | null>(null);
  const [isSpinningLocal, setIsSpinningLocal] = useState(false);
  const [isMuted, toggleMute] = useSoundToggle();
  
  // Sound effects
  const [spinStartSound] = useSoundEffect('/assets/spin-start.mp3', { volume: 0.7 });
  const [winSound] = useSoundEffect('/assets/cluck.mp3', { volume: 0.7 });
  
  const segmentAngle = 360 / rewards.length;

  const handleSpin = async () => {
    if (isSpinningLocal || isSpinning) return;
    
    try {
      // Play spin start sound
      spinStartSound.play();
      
      setIsSpinningLocal(true);
      setCurrentReward(null);
      setShowConfetti(false);
      
      // Calculate random number of full rotations (between 5 and 8)
      const fullRotations = Math.floor(Math.random() * 3 + 5) * 360;

      // Start the spin animation
      setRotation(prev => prev + fullRotations);

      // Get the actual reward from the server
      const result = await onSpin();
      
      if (!result || !result.reward) {
        console.error("Invalid reward returned from server");
        setIsSpinningLocal(false);
        return;
      }

      // Find the segment index for this reward
      const rewardIndex = rewards.findIndex(r => 
        r.reward.type === result.reward.type && 
        (r.reward.chickenType === result.reward.chickenType || 
         (!r.reward.chickenType && !result.reward.chickenType)) &&
        r.reward.amount === result.reward.amount
      );

      // Use a default segment if the reward isn't found
      const targetIndex = rewardIndex !== -1 ? rewardIndex : 0;
      
      // Calculate final rotation to land on the correct segment
      // We need the arrow to point at the reward segment's center
      const finalAngle = targetIndex * segmentAngle + segmentAngle / 2;
      const finalRotation = fullRotations + (360 - finalAngle);
      
      setRotation(finalRotation);

      // Show reward immediately as we know what it is
      setCurrentReward(result.reward);
      
      // Play win sound and show confetti after spin completes
      setTimeout(() => {
        winSound.play();
        setShowConfetti(true);
        setIsSpinningLocal(false);
      }, 3000);

      // Hide confetti after 5 seconds
      setTimeout(() => {
        setShowConfetti(false);
      }, 8000);

    } catch (error) {
      console.error("Error during spin:", error);
      setIsSpinningLocal(false);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center">
      {/* Sound toggle button */}
      <button
        onClick={toggleMute}
        className="absolute top-0 right-0 p-2 text-amber-700 hover:text-amber-900 transition-colors z-10"
        aria-label={isMuted ? "Unmute sounds" : "Mute sounds"}
      >
        {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
      </button>
      
      {showConfetti && (
        <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
          <Confetti
            width={window.innerWidth}
            height={window.innerHeight}
            recycle={false}
            numberOfPieces={200}
            confettiSource={{
              x: window.innerWidth / 2,
              y: window.innerHeight / 3,
              w: 0,
              h: 0
            }}
          />
        </div>
      )}

      {/* SVG Wheel using the provided design */}
      <div className="relative w-80 h-80">
        {/* Outer glow effect */}
        <div
          className="absolute inset-0 rounded-full animate-pulse"
          style={{
            background: 'radial-gradient(circle, rgba(255,215,0,0.3) 0%, rgba(255,165,0,0.1) 70%, rgba(255,165,0,0) 100%)',
            filter: 'blur(10px)',
            transform: 'scale(1.2)',
          }}
        />
        
        <motion.div
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: "transform 3s cubic-bezier(0.2, 0.8, 0.2, 1)"
          }}
          className="relative"
        >
          <svg
            version="1.1"
            id="spinWheel"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 400 400"
            width="320"
            height="320"
            className="drop-shadow-xl"
          >
            {/* Wheel Circle */}
            <circle cx="200" cy="200" r="180" fill="#f1c40f" stroke="#e67e22" strokeWidth="10" />

            {/* Dynamic Wheel Sections based on rewards */}
            {rewards.map((reward, index) => {
              const startAngle = index * segmentAngle;
              const endAngle = (index + 1) * segmentAngle;
              
              // Convert to radians
              const startRad = (startAngle - 90) * Math.PI / 180;
              const endRad = (endAngle - 90) * Math.PI / 180;
              
              // Calculate path
              const x1 = 200 + 180 * Math.cos(startRad);
              const y1 = 200 + 180 * Math.sin(startRad);
              const x2 = 200 + 180 * Math.cos(endRad);
              const y2 = 200 + 180 * Math.sin(endRad);
              
              // Define a unique color for each segment
              const colors = [
                "#e74c3c", "#2ecc71", "#3498db", "#9b59b6", 
                "#1abc9c", "#f39c12", "#d35400", "#34495e"
              ];
              
              const path = `M200,200 L${x1},${y1} A180,180 0 0,1 ${x2},${y2} Z`;
              
              return (
                <g key={index}>
                  <path d={path} fill={colors[index % colors.length]} />
                  <text
                    x="200"
                    y="200"
                    textAnchor="middle"
                    fill="white"
                    fontSize="14"
                    fontWeight="bold"
                    transform={`rotate(${startAngle + segmentAngle/2}, 200, 200) translate(0, -120)`}
                  >
                    {reward.reward.type === "usdt" ? `$${reward.reward.amount}` :
                    reward.reward.type === "chicken" ? `${reward.reward.chickenType}` :
                    `${reward.reward.amount} ${reward.reward.type}`}
                  </text>
                </g>
              );
            })}

            {/* Center Button - Interactive */}
            <g onClick={handleSpin} style={{ cursor: isSpinning ? 'not-allowed' : 'pointer' }}>
              <circle cx="200" cy="200" r="30" fill="#fff" stroke="#333" strokeWidth="5" />
              <text x="200" y="205" fontSize="16" fontWeight="bold" fill="#333" textAnchor="middle" dominantBaseline="middle">
                {isSpinning ? "..." : "SPIN"}
              </text>
            </g>

            {/* Arrow Indicator - We keep it fixed outside of rotation */}
          </svg>
        </motion.div>
        
        {/* Fixed pointer triangle at top - more visible */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 w-12 h-12 z-30">
          <svg width="36" height="36" viewBox="0 0 36 36">
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <polygon points="3,3 33,3 18,30" fill="#ff0000" stroke="#880000" strokeWidth="1.5" filter="url(#glow)" />
          </svg>
        </div>
      </div>

      {/* Spin Button */}
      <Button
        className="mt-8 px-8 py-4 text-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        onClick={handleSpin}
        disabled={isSpinning}
      >
        {isSpinning ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Spinning...
          </>
        ) : (
          `Spin ${spinType === "super" ? "Super Jackpot" : "Wheel"}`
        )}
      </Button>

      {/* Current Reward Display */}
      {currentReward && (
        <Card className="mt-6 mb-4 p-6 text-center bg-gradient-to-b from-amber-50 to-amber-100/50 border-amber-200 shadow-lg animate-in fade-in-0 duration-500 w-full max-w-[90%] mx-auto overflow-hidden">
          <p className="text-lg font-semibold text-amber-900">
            Congratulations! You won:
          </p>
          <p className="text-2xl font-bold mt-2 text-amber-700 break-words overflow-x-auto">
            {currentReward.type === "usdt" ? `$${currentReward.amount} USDT` :
             currentReward.type === "chicken" ? `1 ${currentReward.chickenType} Chicken` :
             `${currentReward.amount} ${currentReward.type}`}
          </p>
        </Card>
      )}
    </div>
  );
}