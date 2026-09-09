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

    // 3. REAL-TIME DATABASE LISTENERS WITH ERROR BOUNDARIES
    const unsubAcc = onSnapshot(
      collection(userRef, "accounts"),
      (snap) => {
        setAccounts(snap.docs.map(d => ({ ...d.data(), id: d.id })).filter(a => !a.isArchived));
      },
      (error) => {
        console.error("[useLedgerData] Accounts sync error:", error);
      }
    );

    const unsubBills = onSnapshot(
      collection(userRef, "bills"),
      (snap) => {
        setBills(snap.docs.map(d => ({ ...d.data(), id: d.id })));
      },
      (error) => {
        console.error("[useLedgerData] Bills sync error:", error);
      }
    );

    const unsubTxs = onSnapshot(
      query(collection(userRef, "transactions"), orderBy("createdAt", "desc")),
      (snap) => {
        setTransactions(snap.docs.map(d => ({ ...d.data(), id: d.id })));
      },
      (error) => {
        console.error("[useLedgerData] Transactions sync error:", error);
      }
    );

    const unsubTodos = onSnapshot(
      query(collection(userRef, "todos"), orderBy("createdAt", "desc")),
      (snap) => {
        setTodos(snap.docs.map(d => ({ ...d.data(), id: d.id })));
      },
      (error) => {
        console.error("[useLedgerData] Todos sync error:", error);
      }
    );

    const unsubConfig = onSnapshot(
      doc(db, "users", user.uid, "settings", "paydayConfig"),
      (docSnap) => {
        if (docSnap.exists()) {
          setPaydayConfig({ frequency: "Weekly", ...docSnap.data() });
        }
      },
      (error) => {
        console.error("[useLedgerData] Payday config sync error:", error);
      }
    );

    // 4. THE SILENT MIGRATION SCRIPT (Clean Immutable Copy)
    const executeSilentMigration = async () => {
      try {
        const legacyFlatData = localStorage.getItem("lp_custom_categories_flat");
        if (legacyFlatData) {
          const parsedStrings = JSON.parse(legacyFlatData);
          if (Array.isArray(parsedStrings) && parsedStrings.length > 0) {
            setModernCategories(prev => {
              return prev.map(groupObj => {
                if (groupObj.group !== "Other") return groupObj;
                const updatedItems = [...groupObj.items];
                parsedStrings.forEach(str => {
                  if (!updatedItems.includes(str)) {
                    updatedItems.push(str);
                  }
                });
                return { ...groupObj, items: updatedItems };
              });
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
