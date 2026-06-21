import AppVisibleFixes from "./AppVisibleFixes.jsx";

export default function App() {
  return (
    <>
      <style>{`
        /* Header plus logique : un seul logo, et pas d'email visible */
        header img[alt="ShopFlow DZ"] {
          display: none !important;
        }

        header .min-w-0.flex-1 p:nth-child(2) {
          display: none !important;
        }

        header .min-w-0.flex-1 p:first-child {
          font-size: 0.95rem !important;
          line-height: 1.25rem !important;
          white-space: normal !important;
        }
      `}</style>
      <AppVisibleFixes />
    </>
  );
}
