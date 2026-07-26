(function () {
  const STORAGE_KEY = 'familia-finanzas-state-v1';

  function getDefaultState() {
    return {
      profiles: [],
      contracts: [],
      transactions: [],
      lastUpdated: null
    };
  }

  function readState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return getDefaultState();
      const parsed = JSON.parse(raw);
      return { ...getDefaultState(), ...parsed };
    } catch (error) {
      console.warn('No se pudo leer el almacenamiento local:', error);
      return getDefaultState();
    }
  }

  function saveState(state) {
    try {
      const payload = JSON.stringify({ ...getDefaultState(), ...state, lastUpdated: new Date().toISOString() });
      localStorage.setItem(STORAGE_KEY, payload);
      return true;
    } catch (error) {
      console.warn('No se pudo guardar el almacenamiento local:', error);
      return false;
    }
  }

  function syncToFirebase(state) {
    if (typeof window !== 'undefined' && window.firebase && window.firebase.apps?.length) {
      try {
        const db = window.firebase.firestore();
        db.collection('familia-finanzas').doc('state').set(state);
      } catch (error) {
        console.warn('No se pudo sincronizar con Firebase:', error);
      }
    }
    return saveState(state);
  }

  window.FinanceStorage = {
    readState,
    saveState,
    syncToFirebase,
    getDefaultState
  };
})();
