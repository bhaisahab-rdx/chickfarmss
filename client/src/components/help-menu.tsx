import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TalkingChicken from './talking-chicken';

// FAQ topics array from the Talking Chicken component
const FAQ_TOPICS = [
  {
    question: "How do I buy chickens?",
    answer: "Go to the Shop tab and select the chicken type you want to buy. You'll need enough USDT balance to make the purchase.",
    emotion: "normal"
  },
  {
    question: "How do I earn USDT?",
    answer: "You can earn USDT by selling eggs in the Market, inviting friends with your referral code, winning on the Spin Wheel, or depositing funds.",
    emotion: "happy"
  },
  {
    question: "How to withdraw earnings?",
    answer: "Go to the Market tab, select the Withdraw section, enter the amount you want to withdraw and your USDT wallet address.",
    emotion: "normal"
  },
  {
    question: "How do chickens produce eggs?",
    answer: "Chickens automatically produce eggs over time. Regular chickens produce more than baby chickens, and golden chickens produce the most!",
    emotion: "excited"
  },
  {
    question: "What are referral bonuses?",
    answer: "When someone uses your referral code and makes a deposit, you earn commission on their deposit amount. You can earn from up to 6 levels of referrals!",
    emotion: "happy"
  }
];

export default function HelpMenu() {
  const [selectedFaq, setSelectedFaq] = useState<string | null>(null);
  const [showChicken, setShowChicken] = useState(false);
  
  const handleFaqSelect = (question: string) => {
    setSelectedFaq(question);
    setShowChicken(true);
  };
  
  const faqAnswer = FAQ_TOPICS.find(faq => faq.question === selectedFaq)?.answer || '';
  const faqEmotion = FAQ_TOPICS.find(faq => faq.question === selectedFaq)?.emotion || 'normal';
  
  return (
    <>
      {/* Fixed help button in bottom right corner */}
      <Dialog>
        <DialogTrigger asChild>
          <Button 
            className="fixed bottom-4 right-4 rounded-full w-12 h-12 p-0 bg-amber-500 hover:bg-amber-600 shadow-lg z-50 animate-pulse" 
            aria-label="Get Help"
            title="Need help? Click here!"
          >
            <HelpCircle size={24} className="text-white" />
          </Button>
        </DialogTrigger>
        
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl text-center font-bold text-amber-700">
              ChickFarms Help Guide
            </DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="faq" className="mt-4">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="faq">FAQ</TabsTrigger>
              <TabsTrigger value="tutorial">Tutorial</TabsTrigger>
            </TabsList>
            
            <TabsContent value="faq" className="space-y-4">
              <div className="grid gap-2 mb-8">
                {FAQ_TOPICS.map((faq) => (
                  <Button 
                    key={faq.question}
                    variant="outline" 
                    className="justify-start text-left h-auto py-2 px-4"
                    onClick={() => handleFaqSelect(faq.question)}
                  >
                    {faq.question}
                  </Button>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="tutorial">
              <div className="text-center p-4 bg-amber-50 rounded-lg">
                <h3 className="font-medium mb-2">Restart Tutorial</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Would you like Clucky to guide you through the basics of ChickFarms again?
                </p>
                <Button 
                  variant="default"
                  className="bg-amber-500 hover:bg-amber-600"
                  onClick={() => {
                    setShowChicken(true);
                    setSelectedFaq(null);
                  }}
                >
                  Start Tutorial
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
      
      {/* Talking Chicken for selected FAQ or tutorial */}
      {showChicken && (
        <TalkingChicken 
          showOnMount={true}
          autoOpen={true}
          message={selectedFaq ? faqAnswer : undefined}
          step={selectedFaq ? undefined : 1}
          onComplete={() => setShowChicken(false)}
          onSkip={() => setShowChicken(false)}
        />
      )}
    </>
  );
}