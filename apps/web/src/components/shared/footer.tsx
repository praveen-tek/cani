import Link from "next/link";
import Image from "next/image";
import StickerPeel from "../shaders/sticker-peel";

export function Footer() {
  return (
    <footer className="relative  text-white overflow-hidden">
      <div className="relative h-64">
        <StickerPeel
          imageSrc="/assets/sticker1.png"
          width={140}
          rotate={-15}
          peelBackHoverPct={30}
          peelBackActivePct={40}
          shadowIntensity={0.5}
          lightingIntensity={0.1}
          initialPosition={{ x: 80, y: 20 }}
          peelDirection={0}
        />
        <StickerPeel
          imageSrc="/assets/sticker4.png"
          width={160}
          rotate={10}
          peelBackHoverPct={30}
          peelBackActivePct={40}
          shadowIntensity={0.5}
          lightingIntensity={0.1}
          initialPosition={{ x: 900, y: 10 }}
          peelDirection={0}
        />
        <StickerPeel
          imageSrc="/assets/sticker1.png"
          width={120}
          rotate={20}
          peelBackHoverPct={30}
          peelBackActivePct={40}
          shadowIntensity={0.5}
          lightingIntensity={0.1}
          initialPosition={{ x: 1400, y: 30 }}
          peelDirection={0}
        />
        <StickerPeel
          imageSrc="/assets/sticker4.png"
          width={150}
          rotate={-25}
          peelBackHoverPct={30}
          peelBackActivePct={40}
          shadowIntensity={0.5}
          lightingIntensity={0.1}
          initialPosition={{ x: 450, y: 20 }}
          peelDirection={0}
        />
        <StickerPeel
          imageSrc="/assets/sticker1.png"
          width={130}
          rotate={5}
          peelBackHoverPct={30}
          peelBackActivePct={40}
          shadowIntensity={0.5}
          lightingIntensity={0.1}
          initialPosition={{ x: 1150, y: 15 }}
          peelDirection={0}
        />
      </div>

      <div className="bg-orange-50 text-gray-900 rounded-t-3xl mt-16 px-10 py-12 flex flex-wrap justify-between gap-12 relative z-10">
        <div className="max-w-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-black flex items-center justify-center p-1.5 shadow-xs shrink-0">
              <Image
                src="/logo.svg"
                alt="Cani Logo"
                width={24}
                height={24}
                className="w-full h-full object-contain"
              />
            </div>
            <h3 className="font-serif text-5xl text-gray-900 leading-none">cani</h3>
          </div>
          <p className="text-sm text-gray-600 mt-3">
            Cani is a shared shopping board. Search stores, add products to a room, vote with friends and get alerts when prices drop.
          </p>
        </div>

        <div className="flex flex-wrap gap-12 sm:gap-16 text-sm">
          <div>
            <p className="font-medium mb-2">Product</p>
            <ul className="space-y-1.5 text-gray-600">
              <li>
                <Link href="#features" className="hover:text-gray-900 transition">Features</Link>
              </li>
              <li>
                <Link href="#about" className="hover:text-gray-900 transition">About</Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-gray-900 transition">Pricing</Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-medium mb-2">Legal</p>
            <ul className="space-y-1.5 text-gray-600">
              <li>
                <Link href="/terms" className="hover:text-gray-900 transition">Terms of Service</Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-gray-900 transition">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/subprocessors" className="hover:text-gray-900 transition">Subprocessors</Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:text-gray-900 transition">Cookie Policy</Link>
              </li>
              <li>
                <Link href="/security" className="hover:text-gray-900 transition">Security & Trust</Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-medium mb-2">Connect</p>
            <ul className="space-y-1.5 text-gray-600">
              <li>
                <Link href="mailto:support@cani.shopping" className="hover:text-gray-900 transition">Contact Us</Link>
              </li>
              <li>
                <Link href="https://twitter.com/cani" target="_blank" rel="noreferrer" className="hover:text-gray-900 transition">Twitter / X</Link>
              </li>
              <li>
                <Link href="https://instagram.com/cani" target="_blank" rel="noreferrer" className="hover:text-gray-900 transition">Instagram</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-orange-50/90 border-t border-orange-100/60 px-10 py-5 text-xs text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-3 relative z-10">
        <p>© {new Date().getFullYear()} Cani Inc. All rights reserved.</p>
        <p className="font-mono text-2xs text-gray-400">Shop with friends, decide together</p>
      </div>
    </footer>
  );
}
