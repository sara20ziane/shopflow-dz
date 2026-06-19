function App() {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-5">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-6 text-center">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-slate-900 flex items-center justify-center">
          <span className="text-white text-2xl font-bold">SF</span>
        </div>

        <h1 className="mt-5 text-3xl font-bold text-slate-900">
          ShopFlow DZ
        </h1>

        <p className="mt-3 text-slate-600 leading-relaxed">
          Gère tes commandes, tes acomptes, tes clientes et tes bénéfices sans cahier ni Excel.
        </p>

        <div className="mt-6 space-y-3">
          <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-semibold">
            Se connecter
          </button>

          <button className="w-full bg-slate-100 text-slate-900 py-4 rounded-2xl font-semibold">
            Créer un compte
          </button>
        </div>

        <p className="mt-5 text-sm text-slate-400">
          Version beta en préparation 🇩🇿
        </p>
      </div>
    </div>
  );
}

export default App;
