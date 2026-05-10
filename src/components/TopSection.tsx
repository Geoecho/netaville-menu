"use client";

import { motion } from "framer-motion";
import Image from "next/image";


export default function TopSection() {
  return (
    <section className="h-full w-full bg-white flex items-center border-t border-zinc-100 overflow-hidden px-8 md:px-12 lg:px-16">
      <div className="flex-1 pr-12">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-3xl md:text-5xl font-black text-black mb-3 tracking-tight">
            Are you an IT student?
          </h1>
          <p className="text-lg md:text-xl text-zinc-500 font-medium leading-tight max-w-xl">
            Scan the QR code, download the app, sign up with your student email & enjoy <span className="text-[#00BFFE] font-bold">40% off</span> selected offers.
          </p>
        </motion.div>
      </div>
      <div className="h-full py-4 flex-shrink-0 relative">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="h-full aspect-square relative rounded-2xl flex items-center justify-end"
        >
          <div className="relative w-full h-full flex items-center justify-end p-3 pr-0">
            <Image
              src="/qr-code.svg"
              alt="QR Code"
              width={150}
              height={150}
              className="w-full h-full object-contain"
              priority
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
