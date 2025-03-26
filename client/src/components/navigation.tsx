import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUIState } from "@/hooks/use-ui-state";

// Logo component
function Logo() {
  return (
    <img 
      src="/assets/chickfarms-logo.png" 
      className="h-10 w-auto object-contain" 
      alt="ChickFarms" 
    />
  );
}

// Game icons
function HomeIcon() {
  return <img src="/assets/home-icon.png" className="w-6 h-6 sm:w-8 sm:h-8 object-contain" alt="Home" />;
}

function ShopIcon() {
  return <img src="/assets/shop-icon.png" className="w-6 h-6 sm:w-8 sm:h-8 object-contain" alt="Shop" />;
}

function MarketIcon() {
  return <img src="/assets/market-icon.png" className="w-6 h-6 sm:w-8 sm:h-8 object-contain" alt="Market" />;
}

function WalletIcon() {
  return <img src="/assets/wallet-icon.png" className="w-6 h-6 sm:w-8 sm:h-8 object-contain" alt="Wallet" />;
}

function ReferralsIcon() {
  return (
    <img 
      src="/assets/referrals-megaphone-icon.png" 
      className="w-6 h-6 sm:w-8 sm:h-8 object-contain" 
      alt="Referrals" 
    />
  );
}

function SpinIcon() {
  return (
    <img 
      src="/assets/spin-wheel-icon.svg" 
      className="w-6 h-6 sm:w-8 sm:h-8 object-contain" 
      alt="Spin" 
    />
  );
}

export default function Navigation() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const { hideUIElements } = useUIState();

  if (!user) return null;
  
  // Hide navigation when spin wheel is active
  if (hideUIElements) return null;

  const initials = user.username.split(" ").map((n) => n[0]).join("").toUpperCase();

  const isActive = (path: string) => location === path;

  return (
    <>
      {/* Desktop navigation - now at the bottom for all devices */}
      <nav className="hidden md:block fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-sm border-t shadow-sm z-50">
        <div className="container mx-auto">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/home">
                <Logo />
              </Link>
              <div className="flex items-center space-x-2">
                <Link href="/home">
                  <Button 
                    variant={location === "/home" ? "default" : "ghost"} 
                    className="flex items-center h-10 gap-2 font-medium" 
                    size="sm"
                  >
                    <HomeIcon />
                    <span>Home</span>
                  </Button>
                </Link>
                <Link href="/shop">
                  <Button 
                    variant={location === "/shop" ? "default" : "ghost"}
                    className="flex items-center h-10 gap-2 font-medium" 
                    size="sm"
                  >
                    <ShopIcon />
                    <span>Shop</span>
                  </Button>
                </Link>
                <Link href="/market">
                  <Button 
                    variant={location === "/market" ? "default" : "ghost"}
                    className="flex items-center h-10 gap-2 font-medium" 
                    size="sm"
                  >
                    <MarketIcon />
                    <span>Market</span>
                  </Button>
                </Link>
                <Link href="/wallet">
                  <Button 
                    variant={location === "/wallet" ? "default" : "ghost"}
                    className="flex items-center h-10 gap-2 font-medium" 
                    size="sm"
                  >
                    <WalletIcon />
                    <span>Wallet</span>
                  </Button>
                </Link>
                <Link href="/referrals">
                  <Button 
                    variant={location === "/referrals" ? "default" : "ghost"}
                    className="flex items-center h-10 gap-2 font-medium" 
                    size="sm"
                  >
                    <ReferralsIcon />
                    <span>Referrals</span>
                  </Button>
                </Link>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-2 h-10">
                  <span className="font-medium">{user.username}</span>
                  <Avatar className="h-7 w-7 ring-2 ring-primary/20">
                    <AvatarFallback className="bg-primary/10 text-xs">{initials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.username}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      Balance: ${user.usdtBalance || 0}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href="/account">
                  <DropdownMenuItem className="cursor-pointer">
                    My Account
                  </DropdownMenuItem>
                </Link>
                {user.isAdmin && (
                  <Link href="/admin">
                    <DropdownMenuItem className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Admin Panel</span>
                    </DropdownMenuItem>
                  </Link>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="cursor-pointer text-destructive"
                  onClick={() => logoutMutation.mutate()}
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      {/* Mobile navigation - always at the bottom */}
      <AnimatePresence>
        <motion.nav 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{ type: "spring", stiffness: 400, damping: 35 }}
          className="block md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t shadow-lg z-50"
        >
          <div className="container mx-auto px-1 sm:px-2">
            <div className="flex items-center justify-between py-1 sm:py-2">
              {[
                { path: "/home", icon: <HomeIcon />, label: "Home" },
                { path: "/shop", icon: <ShopIcon />, label: "Shop" },
                { path: "/market", icon: <MarketIcon />, label: "Market" },
                { path: "/wallet", icon: <WalletIcon />, label: "Wallet" },
                { path: "/referrals", icon: <ReferralsIcon />, label: "Referrals" },
                { path: "/account", icon: 
                  <Avatar className="h-6 w-6 sm:h-8 sm:w-8 ring-1 ring-primary/20">
                    <AvatarFallback className="bg-primary/10 text-[10px] sm:text-xs">{initials}</AvatarFallback>
                  </Avatar>, 
                  label: "Account" 
                }
              ].map((item) => (
                <Link key={item.path} href={item.path}>
                  <motion.div
                    whileTap={{ scale: 0.95 }}
                    className="relative"
                  >
                    <Button 
                      variant={isActive(item.path) ? "default" : "ghost"}
                      className={`flex flex-col items-center justify-center space-y-1 h-14 w-14 sm:h-16 sm:w-16 px-0
                        ${isActive(item.path) ? 'bg-primary/10 border border-primary/30' : ''}`}
                    >
                      <div className="flex items-center justify-center h-8">
                        {item.icon}
                      </div>
                      <span className="text-[10px] sm:text-xs font-medium">{item.label}</span>
                    </Button>
                    {isActive(item.path) && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute -bottom-1 left-0 right-0 h-1 bg-primary rounded-t-full"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>
        </motion.nav>
      </AnimatePresence>
    </>
  );
}