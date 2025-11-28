"use client";

import Image from "next/image";
import { useState } from "react";
import CalendarModal from "@/components/CalendarModal";

export default function Header() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      {/* 🟥 HEADER */}
      <header className="w-full bg-white shadow-md border-b-2 border-red-600 flex justify-between items-center p-4">
        <div className="flex items-center gap-2">
          <Image src="/escudo.png" alt="Catoira S.D." width={40} height={40} />
          <h1 className="text-xl font-bold text-red-600">Catoira S.D.</h1>
        </div>

      <div className="ml-auto">
        <CalendarModal />
      </div>
      </header>

    </>
  );
}
