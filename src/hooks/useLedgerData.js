import { useEffect } from 'react';
import { collection, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useLedger } from '../context/LedgerContext';
import { demoAccounts, demoBills, demoTransactions, demoTodos, demoPaydayConfig } from '../demoData';

export const useLedgerData = () => {
  const {
    user,
    isDemoMode,
    setAccounts,
    setBills,
    setTransactions,
    setTodos,
    setPaydayConfig,
    setModernCategories
  } = useLedger();

  useEffect(() => {
    // 1. DEMO VAULT INITIALIZATION
    if (isDemoMode) {
      setAccounts(demoAccounts || []);
      setBills(demoBills || []);
      setTransactions(demoTransactions || []);
      setTodos(demoTodos || []);
      setPaydayConfig({ frequency: "Weekly", ...(demoPaydayConfig || {}) });
      return;
    }

    // 2. REQUIRE ACTIVE USER FOR FIREBASE SYNC
    if (!user) return;

    const userRef = doc(db, "users", user.uid);

    // 3. REAL-TIME DATABASE LISTENERS
    // Surgical Fix: The ...d.data(), id: d.id order forces Firebase's secure ID to override any temporary local ID
    const unsubAcc = onSnapshot(collection(userRef, "accounts"), (snap) => {
      setAccounts(snap.docs.map(d => ({ ...d.data(), id: d.id })).filter(a => !a.isArchived));
    });

    const unsubBills = onSnapshot(collection(userRef, "bills"), (snap) => {
      setBills(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    });

    const unsubTxs = onSnapshot(query(collection(userRef, "transactions"), orderBy("createdAt", "desc")), (snap) => {
      setTransactions(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    });

    const unsubTodos = onSnapshot(query(collection(userRef, "todos"), orderBy("createdAt", "desc")), (snap) => {
      setTodos(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    });

    const unsubConfig = onSnapshot(doc(db, "users", user.uid, "settings", "paydayConfig"), (docSnap) => {
      if (docSnap.exists()) {
        setPaydayConfig({ frequency: "Weekly", ...docSnap.data() });
      }
    });

    // 4. THE SILENT MIGRATION SCRIPT (Legacy Architecture Consolidation)
    const executeSilentMigration = async () => {
      try {
        const legacyFlatData = localStorage.getItem("lp_custom_categories_flat");
        if (legacyFlatData) {
          const parsedStrings = JSON.parse(legacyFlatData);
          if (Array.isArray(parsedStrings) && parsedStrings.length > 0) {
            setModernCategories(prev => {
              const duplicatedMatrix = [...prev];
              const targetBucket = duplicatedMatrix.find(g => g.group === "Other");
              if (targetBucket) {
                parsedStrings.forEach(str => {
                  if (!targetBucket.items.includes(str)) targetBucket.items.push(str);
                });
              }
              return duplicatedMatrix;
            });
            localStorage.removeItem("lp_custom_categories_flat");
          }
        }
      } catch (err) {
        console.error("Silent data architecture consolidation bypassed:", err);
      }
    };

    executeSilentMigration();

    // 5. CLEANUP FUNCTION TO PREVENT MEMORY LEAKS
    return () => {
      unsubAcc();
      unsubBills();
      unsubTxs();
      unsubTodos();
      unsubConfig();
    };
  }, [user, isDemoMode, setAccounts, setBills, setTransactions, setTodos, setPaydayConfig, setModernCategories]);
};
