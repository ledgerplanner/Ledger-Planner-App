import { useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export function useBirthdayEngine({
  user,
  isDemoMode = false,
  triggerVictory,
  openGlobalAction
}) {
  useEffect(() => {
    if (!user || isDemoMode) return;

    const fetchBirthday = async () => {
      try {
        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.birthday) {
            const today = new Date();
            const todayStr = `${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
            const bdayStr = data.birthday.length > 5 ? data.birthday.substring(5) : data.birthday;
            const bdayYear = today.getFullYear();
            const storageKey = `lp_bday_celebrated_${bdayYear}`;

            if (bdayStr === todayStr && localStorage.getItem(storageKey) !== "true") {
              if (triggerVictory) triggerVictory();
              const activeName = data.firstName || user?.displayName?.split(" ")[0] || "Founder";
              if (openGlobalAction) {
                openGlobalAction(
                  "Happy Birthday! 🎂",
                  `Happy Birthday, ${activeName}. We at Ledger Planner wish you many more!`,
                  "Let's Go",
                  false,
                  () => {},
                  true
                );
              }
              localStorage.setItem(storageKey, "true");
            }
          }
        }
      } catch (err) {
        console.error("Failed to check birthday status:", err);
      }
    };

    fetchBirthday();
  }, [user, isDemoMode, triggerVictory, openGlobalAction]);
}
