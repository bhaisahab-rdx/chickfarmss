import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { SpinWheel } from "@/components/ui/spin-wheel";
import { SpinRewardType } from "@shared/schema";
import { X } from "lucide-react";
import { useUIState } from "@/hooks/use-ui-state";

export interface SpinWheelModalProps {
  isOpen: boolean;
  onClose: () => void;
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

export function SpinWheelModal({
  isOpen,
  onClose,
  onSpin,
  rewards,
  isSpinning,
  spinType,
}: SpinWheelModalProps) {
  // This state is used to prevent glitchy animation when closing the dialog
  const [showWheel, setShowWheel] = useState(false);
  
  // Get UI context to notify when the wheel is open
  const { setSpinWheelOpen } = useUIState();

  // First effect just for the animation delay
  useEffect(() => {
    // When dialog opens, set a small delay to show the wheel
    // This prevents animation glitches
    if (isOpen) {
      const timer = setTimeout(() => {
        setShowWheel(true);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setShowWheel(false);
    }
  }, [isOpen]);

  // Separate effect for UI state updates
  useEffect(() => {
    // Notify UI context when spin wheel modal opens or closes
    setSpinWheelOpen(isOpen);
  }, [isOpen, setSpinWheelOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="sm:max-w-[800px] p-0 bg-gradient-to-b from-amber-50 to-orange-100 border-amber-300 max-h-[90vh] overflow-y-auto overscroll-contain"
        aria-describedby="spin-wheel-description"
      >
        <div className="relative pt-10 pb-6 px-6">
          <VisuallyHidden>
            <DialogTitle>Spin Wheel Game</DialogTitle>
          </VisuallyHidden>
          
          {/* Close button - now fixed to ensure it's always visible */}
          <button
            onClick={onClose}
            className="fixed top-4 right-4 rounded-full h-8 w-8 inline-flex items-center justify-center border border-amber-200 bg-white/80 hover:bg-amber-100 transition-colors z-[60]"
            disabled={isSpinning}
            style={{ position: 'fixed' }}
          >
            <X className="h-4 w-4 text-amber-900" />
            <span className="sr-only">Close</span>
          </button>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-amber-900">
              {spinType === "daily" ? "Daily Spin" : "Super Jackpot Spin"}
            </h2>
            <p className="text-amber-700" id="spin-wheel-description">
              {spinType === "daily"
                ? "Try your luck and win awesome rewards!"
                : "Big stakes, amazing rewards!"}
            </p>
          </div>

          {showWheel && (
            <div className="overflow-visible">
              <SpinWheel
                onSpin={onSpin}
                rewards={rewards}
                isSpinning={isSpinning}
                spinType={spinType}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}