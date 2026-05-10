"use client";

import { motion } from "framer-motion";
import Image from "next/image";


export default function TopSection() {
  return (
    <section className="h-[22vh] w-full bg-bg-primary flex items-center border-b border-card-border overflow-hidden px-8 md:px-12 lg:px-16 transition-all duration-1000">
      <div className="flex-1 pr-12">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-3xl md:text-5xl font-black text-text-primary mb-3 tracking-tight transition-colors duration-1000">
            Are you an IT student?
          </h1>
          <p className="text-lg md:text-xl text-text-dim font-medium leading-tight max-w-xl transition-colors duration-1000">
            Scan the QR code, download the app, sign up with your student email & enjoy <span className="text-brand font-bold">40% off</span> selected offers.
          </p>
        </motion.div>
      </div>
      <div className="h-full py-4 flex-shrink-0 relative">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="h-full aspect-square relative rounded-2xl"
        >
          <div className="relative w-full h-full flex items-center justify-center p-3">
            <Image
              src="/qr-code.svg"
              alt="QR Code"
              width={150}
              height={150}
              className="w-full h-full object-contain dark:invert transition-all duration-1000"
              priority
            />
            {/* Netaville logo in the center of the QR code - stays the same in both themes */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-bg-primary p-2 rounded-xl transition-colors duration-1000">
                <Image
                  src="/netaville-logo.svg"
                  alt="Netaville Logo"
                  width={40}
                  height={40}
                  className="w-10 h-10 object-contain"
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

