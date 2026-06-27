import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import AppUxClean from "./AppUxClean.jsx";
import { auth } from "./firebase";
import SalesAssistantPage from "./features/salesAssistant/SalesAssistantPage.jsx";

export default function AppWithSalesAssistant() {
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  return (
    <>
      <AppUxClean />

      {user && !open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-40 left-4 z-[9998] rounded-full bg-gradient-to-r from-[#00E5FF] to-[#00C4B4] px-4 py-3 text-sm font-black text-[#07142B] shadow-2xl"
        >
          Assistant IA
        </button>
      )}

      {user && open && (
        <div className="fixed inset-0 z-[10000] overflow-y-auto bg-[#F5F8FC]">
          <SalesAssistantPage user={user} onClose={() => setOpen(false)} />
        </div>
      )}
    </>
  );
}
