"use client";

import Header from "@/components/gravity-components/Header";
import { JSX, useState, useEffect } from "react";
import StarBackground from "@/components/gravity-components/landing-page/StarBackground";
import FloatingBlobs from "@/components/gravity-components/landing-page/FloatingBlobs";
import HeroSection from "@/components/gravity-components/landing-page/HeroSection";
import OrbitingDivider from "@/components/gravity-components/landing-page/OrbitingDivider";
import FeaturesSection from "@/components/gravity-components/landing-page/FeaturesSection";
import { ClerkLoaded, ClerkLoading } from "@clerk/nextjs";
import Loader from "@/components/gravity-components/loader";

export default function Home(): JSX.Element {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <Loader />;

  return (
    <>
      <ClerkLoading>
        <Loader />
      </ClerkLoading>
      <ClerkLoaded>
        <div className="flex flex-col w-full min-h-screen bg-linear-to-b dark:from-gray-950 dark:via-purple-950/20 dark:to-gray-950 overflow-hidden relative">
          <StarBackground />
          <FloatingBlobs />
          <Header />
          <main className="flex flex-1 w-full flex-col items-center justify-center px-6 sm:px-16 relative z-10">
            <HeroSection />
            <OrbitingDivider />
            <FeaturesSection />
          </main>
        </div>
      </ClerkLoaded>
    </>
  );
}
