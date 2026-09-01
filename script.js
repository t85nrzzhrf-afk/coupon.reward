import { initializeApp } from
"https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
}
from
"https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    increment
}
from
"https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// ========================================
// FIREBASE CONFIG
// ========================================

const firebaseConfig = {

    apiKey: "AIzaSyBpOPt_eV8Etu6hHfFS3mCGJBq6odru3rg",
    authDomain: "rewardx2026.firebaseapp.com",
    projectId: "rewardx2026",
    storageBucket: "rewardx2026.firebasestorage.app",
    messagingSenderId: "930055573089",
    appId: "1:930055573089:web:8c5abfabf7729c60b16420"

};


// ========================================
// INITIALIZE FIREBASE
// ========================================

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);


// ========================================
// GLOBAL VARIABLES
// ========================================

let currentUser = null;

let timerInterval = null;

let spinTimeout = null;


// ========================================
// AUTH STATE
// ========================================

onAuthStateChanged(auth, async (user) => {

    currentUser = user;

    if (user) {

        document
            .getElementById("loggedOutNav")
            ?.classList.add("hidden");

        document
            .getElementById("loggedInNav")
            ?.classList.remove("hidden");

        const loginRequired =
            document.getElementById("loginRequired");

        if (loginRequired) {
            loginRequired.style.display = "none";
        }

        await loadUserData();

    } else {

        document
            .getElementById("loggedOutNav")
            ?.classList.remove("hidden");

        document
            .getElementById("loggedInNav")
            ?.classList.add("hidden");

        const loginRequired =
            document.getElementById("loginRequired");

        if (loginRequired) {
            loginRequired.style.display = "block";
        }

        updateUI(0, 0);

        updateChallengeUI({
            dailyAds: 0,
            dailySpin: 0,
            dailyRedeem: 0,
            challengeRewardClaimed: false
        });

        updateStreakUI(0);

    }

});


// ========================================
// SIGN UP
// ========================================

window.signupUser = async function () {

    const name =
        document.getElementById("signupName").value.trim();

    const email =
        document.getElementById("signupEmail").value.trim();

    const password =
        document.getElementById("signupPassword").value;

    const error =
        document.getElementById("signupError");


    if (!name || !email || !password) {

        error.innerText =
            "Please fill all fields.";

        return;
    }


    if (password.length < 6) {

        error.innerText =
            "Password must contain at least 6 characters.";

        return;
    }


    try {

        const result =
            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );


        await updateProfile(
            result.user,
            {
                displayName: name
            }
        );


        await setDoc(
            doc(db, "users", result.user.uid),
            {

                name: name,
                email: email,

                coins: 0,
                adsWatched: 0,
                totalEarned: 0,

                subscription: "Free",
                subscriptionPrice: 0,
                multiplier: 1,
                subscriptionActive: false,

                // DAILY CHALLENGES
                challengeDate: getToday(),

                dailyAds: 0,

                dailySpin: 0,

                dailyRedeem: 0,

                challengeRewardClaimed: false,

                // DAILY STREAK
                lastLoginDate: "",

                streak: 0,

                // SPIN
                lastSpinDate: "",

                createdAt: new Date()

            }
        );


        alert(
            "Account created successfully!"
        );

        closeAuth();

    }

    catch (err) {

        console.error(err);

        error.innerText =
            getFriendlyError(err.code);

    }

};


// ========================================
// LOGIN
// ========================================

window.loginUser = async function () {

    const email =
        document.getElementById("loginEmail").value.trim();

    const password =
        document.getElementById("loginPassword").value;

    const error =
        document.getElementById("loginError");


    if (!email || !password) {

        error.innerText =
            "Please enter email and password.";

        return;
    }


    try {

        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

        closeAuth();

    }

    catch (err) {

        console.error(err);

        error.innerText =
            getFriendlyError(err.code);

    }

};


// ========================================
// LOGOUT
// ========================================

window.logout = async function () {

    try {

        await signOut(auth);

    }

    catch (error) {

        console.error(error);

    }

};


// ========================================
// LOAD USER DATA
// ========================================

async function loadUserData() {

    if (!currentUser) return;


    const userRef =
        doc(db, "users", currentUser.uid);


    const snapshot =
        await getDoc(userRef);


    if (!snapshot.exists()) return;


    let data =
        snapshot.data();


    // RESET DAILY CHALLENGES
    data =
        await resetDailyDataIfNeeded(data);


    // UPDATE STREAK
    await updateDailyStreak(data);


    // LOAD FRESH DATA
    await loadUserDataAfterStreak();

}


// ========================================
// LOAD DATA AFTER STREAK
// ========================================

async function loadUserDataAfterStreak() {

    if (!currentUser) return;


    const userRef =
        doc(db, "users", currentUser.uid);


    const snapshot =
        await getDoc(userRef);


    if (!snapshot.exists()) return;


    const data =
        snapshot.data();


    updateUI(
        Number(data.coins) || 0,
        Number(data.adsWatched) || 0,
        Number(data.totalEarned) || 0
    );


    updateChallengeUI(data);


    updateStreakUI(
        Number(data.streak) || 0
    );

}


// ========================================
// UPDATE MAIN UI
// ========================================

function updateUI(coins, ads, totalEarned = coins) {

    const navCoins =
        document.getElementById("navCoins");

    const heroCoins =
        document.getElementById("heroCoins");

    const adsWatched =
        document.getElementById("adsWatched");

    const totalEarnedElement =
        document.getElementById("totalEarned");


    if (navCoins) {

        navCoins.innerText =
            coins;

    }


    if (heroCoins) {

        heroCoins.innerText =
            coins;

    }


    if (adsWatched) {

        adsWatched.innerText =
            ads;

    }


    if (totalEarnedElement) {

        totalEarnedElement.innerText =
            totalEarned;

    }

}


// ========================================
// WATCH AD
// ========================================

window.startAd = function () {

    if (!currentUser) {

        openAuth("login");

        return;

    }


    const modal =
        document.getElementById("adModal");


    if (!modal) return;


    modal.style.display = "flex";


    let timeLeft = 10;


    const timer =
        document.getElementById("timer");

    const status =
        document.getElementById("adStatus");


    if (timer) {

        timer.innerText =
            timeLeft;

    }


    if (status) {

        status.innerText =
            "Advertisement is playing...";

    }


    clearInterval(timerInterval);


    timerInterval =
        setInterval(async () => {

            timeLeft--;


            if (timer) {

                timer.innerText =
                    timeLeft;

            }


            if (timeLeft <= 0) {

                clearInterval(timerInterval);

                await giveDemoReward();

            }

        }, 1000);

};


// ========================================
// GIVE AD REWARD
// ========================================

async function giveDemoReward() {

    if (!currentUser) return;


    const userRef =
        doc(db, "users", currentUser.uid);


    try {

        const snapshot =
            await getDoc(userRef);


        if (!snapshot.exists()) return;


        const data =
            snapshot.data();


        const multiplier =
            Number(data.multiplier) || 1;


        const baseReward = 10;


        const reward =
            baseReward * multiplier;


        await updateDoc(
            userRef,
            {

                coins:
                    increment(reward),

                adsWatched:
                    increment(1),

                totalEarned:
                    increment(reward),

                dailyAds:
                    increment(1)

            }
        );


        await loadUserData();


        const status =
            document.getElementById("adStatus");


        if (status) {

            status.innerText =
                `✓ Advertisement completed! +${reward} coins`;

        }

    }

    catch (error) {

        console.error(error);


        const status =
            document.getElementById("adStatus");


        if (status) {

            status.innerText =
                "Something went wrong.";

        }

    }

}


// ========================================
// CLOSE AD
// ========================================

window.closeAd = function () {

    const modal =
        document.getElementById("adModal");


    if (modal) {

        modal.style.display =
            "none";

    }


    clearInterval(timerInterval);

};


// ========================================
// REDEEM REWARD
// ========================================

window.redeemReward = async function (requiredCoins) {

    if (!currentUser) {

        openAuth("login");

        return;

    }


    const userRef =
        doc(db, "users", currentUser.uid);


    try {

        const snapshot =
            await getDoc(userRef);


        if (!snapshot.exists()) return;


        const data =
            snapshot.data();


        const coins =
            Number(data.coins) || 0;


        if (coins < requiredCoins) {

            alert(
                `You need ${requiredCoins - coins} more coins.`
            );

            return;

        }


        await updateDoc(
            userRef,
            {

                coins:
                    increment(-requiredCoins),

                dailyRedeem:
                    increment(1)

            }
        );


        await loadUserData();


        const couponCode =
            "RX" +
            requiredCoins +
            "-DEMO";


        const couponTitle =
            document.getElementById("couponTitle");


        const couponCodeElement =
            document.getElementById("couponCode");


        const couponModal =
            document.getElementById("couponModal");


        if (couponTitle) {

            couponTitle.innerText =
                `₹${requiredCoins} OFF`;

        }


        if (couponCodeElement) {

            couponCodeElement.innerText =
                couponCode;

        }


        if (couponModal) {

            couponModal.style.display =
                "flex";

        }

    }

    catch (error) {

        console.error(error);

        alert(
            "Could not redeem reward."
        );

    }

};


// ========================================
// AUTH UI
// ========================================

window.openAuth = function (type) {

    const modal =
        document.getElementById("authModal");


    if (modal) {

        modal.style.display =
            "flex";

    }


    if (type === "signup") {

        showSignup();

    }

    else {

        showLogin();

    }

};


window.closeAuth = function () {

    const modal =
        document.getElementById("authModal");


    if (modal) {

        modal.style.display =
            "none";

    }

};


window.showSignup = function () {

    document
        .getElementById("loginForm")
        ?.classList.add("hidden");


    document
        .getElementById("signupForm")
        ?.classList.remove("hidden");

};


window.showLogin = function () {

    document
        .getElementById("signupForm")
        ?.classList.add("hidden");


    document
        .getElementById("loginForm")
        ?.classList.remove("hidden");

};


// ========================================
// ADVERTISER
// ========================================

window.contactAdvertiser = function () {

    alert(
        "Advertiser registration coming soon."
    );

};


// ========================================
// COUPON UI
// ========================================

window.closeCoupon = function () {

    const modal =
        document.getElementById("couponModal");


    if (modal) {

        modal.style.display =
            "none";

    }

};


window.copyCoupon = function () {

    const element =
        document.getElementById("couponCode");


    if (!element) return;


    const code =
        element.innerText;


    navigator.clipboard
        .writeText(code)
        .then(() => {

            alert(
                "Coupon code copied!"
            );

        })
        .catch(() => {

            alert(
                "Could not copy coupon code."
            );

        });

};


// ========================================
// SUBSCRIPTIONS
// ========================================

window.buySubscription = async function (
    plan,
    price,
    multiplier
) {

    if (!currentUser) {

        openAuth("login");

        return;

    }


    const userRef =
        doc(db, "users", currentUser.uid);


    try {

        const confirmed =
            confirm(
                `${plan} Plan\n\n` +
                `Price: ₹${price}\n` +
                `Coin Multiplier: ${multiplier}×\n\n` +
                `Activate this prototype subscription?`
            );


        if (!confirmed) return;


        await updateDoc(
            userRef,
            {

                subscription:
                    plan,

                subscriptionPrice:
                    price,

                multiplier:
                    multiplier,

                subscriptionActive:
                    true

            }
        );


        await loadUserData();


        alert(
            `✓ ${plan} subscription activated!\n\n` +
            `Multiplier: ${multiplier}×\n\n` +
            `Prototype mode — no real payment taken.`
        );

    }

    catch (error) {

        console.error(error);


        alert(
            "Could not activate subscription."
        );

    }

};


// ========================================
// DAILY SPIN
// ========================================

window.spinWheel = async function () {

    if (!currentUser) {

        openAuth("login");

        return;

    }


    const userRef =
        doc(db, "users", currentUser.uid);


    try {

        const snapshot =
            await getDoc(userRef);


        if (!snapshot.exists()) return;


        const data =
            snapshot.data();


        const today =
            getToday();


        // ALREADY SPUN
        if (data.lastSpinDate === today) {

            document
                .getElementById("spinStatus")
                .innerText =
                "You already used your daily spin! Come back tomorrow 🎡";

            return;

        }


        const button =
            document.getElementById("spinButton");


        const wheel =
            document.getElementById("spinWheel");


        if (!button || !wheel) return;


        button.disabled =
            true;


        document
            .getElementById("spinStatus")
            .innerText =
            "Spinning... 🎡";


        const rewards =
            [5, 10, 20, 50];


        const reward =
            rewards[
                Math.floor(
                    Math.random() *
                    rewards.length
                )
            ];


        const rotation =
            1800 +
            Math.floor(
                Math.random() * 1440
            );


        wheel.style.transform =
            `rotate(${rotation}deg)`;


        clearTimeout(spinTimeout);


        spinTimeout =
            setTimeout(
                async () => {

                    try {

                        await updateDoc(
                            userRef,
                            {

                                coins:
                                    increment(reward),

                                totalEarned:
                                    increment(reward),

                                lastSpinDate:
                                    today,

                                dailySpin:
                                    1

                            }
                        );


                        await loadUserData();


                        document
                            .getElementById("spinStatus")
                            .innerText =
                            `🎉 You won ${reward} coins!`;

                    }

                    catch (error) {

                        console.error(error);

                        document
                            .getElementById("spinStatus")
                            .innerText =
                            "Could not save your reward.";

                    }


                    button.disabled =
                        false;

                },
                5000
            );

    }

    catch (error) {

        console.error(error);


        document
            .getElementById("spinStatus")
            .innerText =
            "Something went wrong.";


        const button =
            document.getElementById("spinButton");


        if (button) {

            button.disabled =
                false;

        }

    }

};


// ========================================
// GET TODAY
// ========================================

function getToday() {

    return new Date()
        .toISOString()
        .split("T")[0];

}


// ========================================
// RESET DAILY DATA
// ========================================

async function resetDailyDataIfNeeded(data) {

    const today =
        getToday();


    if (data.challengeDate !== today) {

        await updateDoc(
            doc(db, "users", currentUser.uid),
            {

                challengeDate:
                    today,

                dailyAds:
                    0,

                dailySpin:
                    0,

                dailyRedeem:
                    0,

                challengeRewardClaimed:
                    false

            }
        );


        return {

            ...data,

            challengeDate:
                today,

            dailyAds:
                0,

            dailySpin:
                0,

            dailyRedeem:
                0,

            challengeRewardClaimed:
                false

        };

    }


    return data;

}


// ========================================
// DAILY CHALLENGE UI
// ========================================

function updateChallengeUI(data) {

    const ads =
        Math.min(
            Number(data.dailyAds) || 0,
            3
        );


    const spin =
        Math.min(
            Number(data.dailySpin) || 0,
            1
        );


    const redeem =
        Math.min(
            Number(data.dailyRedeem) || 0,
            1
        );


    // PROGRESS TEXT

    const adProgress =
        document.getElementById(
            "adChallengeProgress"
        );


    const spinProgress =
        document.getElementById(
            "spinChallengeProgress"
        );


    const redeemProgress =
        document.getElementById(
            "redeemChallengeProgress"
        );


    if (adProgress) {

        adProgress.innerText =
            `${ads} / 3`;

    }


    if (spinProgress) {

        spinProgress.innerText =
            `${spin} / 1`;

    }


    if (redeemProgress) {

        redeemProgress.innerText =
            `${redeem} / 1`;

    }


    // PROGRESS BARS

    const adBar =
        document.getElementById(
            "adChallengeBar"
        );


    const spinBar =
        document.getElementById(
            "spinChallengeBar"
        );


    const redeemBar =
        document.getElementById(
            "redeemChallengeBar"
        );


    if (adBar) {

        adBar.style.width =
            `${(ads / 3) * 100}%`;

    }


    if (spinBar) {

        spinBar.style.width =
            `${spin * 100}%`;

    }


    if (redeemBar) {

        redeemBar.style.width =
            `${redeem * 100}%`;

    }


    // CLAIM BUTTON

    const claimButton =
        document.getElementById(
            "claimChallengeButton"
        );


    if (!claimButton) return;


    const completed =
        ads >= 3 &&
        spin >= 1 &&
        redeem >= 1;


    if (data.challengeRewardClaimed === true) {

        claimButton.innerText =
            "✓ Reward Claimed";

        claimButton.disabled =
            true;

    }

    else if (completed) {

        claimButton.innerText =
            "🎁 Claim 100 Coins";

        claimButton.disabled =
            false;

    }

    else {

        claimButton.innerText =
            "🔒 Complete All Challenges";

        claimButton.disabled =
            true;

    }

}


// ========================================
// CLAIM DAILY CHALLENGE REWARD
// ========================================

window.claimDailyChallenge = async function () {

    if (!currentUser) {

        openAuth("login");

        return;

    }


    const userRef =
        doc(db, "users", currentUser.uid);


    try {

        const snapshot =
            await getDoc(userRef);


        if (!snapshot.exists()) return;


        const data =
            snapshot.data();


        const ads =
            Number(data.dailyAds) || 0;


        const spin =
            Number(data.dailySpin) || 0;


        const redeem =
            Number(data.dailyRedeem) || 0;


        // ALREADY CLAIMED

        if (
            data.challengeRewardClaimed === true
        ) {

            alert(
                "You already claimed today's challenge reward!"
            );

            return;

        }


        // NOT COMPLETED

        if (
            ads < 3 ||
            spin < 1 ||
            redeem < 1
        ) {

            alert(
                "Complete all 3 daily challenges first!"
            );

            return;

        }


        const challengeReward =
            100;


        // GIVE REWARD

        await updateDoc(
            userRef,
            {

                coins:
                    increment(challengeReward),

                totalEarned:
                    increment(challengeReward),

                challengeRewardClaimed:
                    true

            }
        );


        await loadUserData();


        alert(
            `🎉 Daily Challenge Complete!\n\n` +
            `+${challengeReward} Coins`
        );

    }

    catch (error) {

        console.error(error);


        alert(
            "Could not claim reward."
        );

    }

};


// ========================================
// DAILY STREAK
// ========================================

async function updateDailyStreak(data) {

    if (!currentUser) return;


    const today =
        getToday();


    // ALREADY LOGGED IN TODAY

    if (
        data.lastLoginDate === today
    ) {

        updateStreakUI(
            Number(data.streak) || 0
        );

        return;

    }


    // YESTERDAY

    const yesterday =
        new Date();


    yesterday.setDate(
        yesterday.getDate() - 1
    );


    const yesterdayString =
        yesterday
            .toISOString()
            .split("T")[0];


    let newStreak =
        1;


    // CONTINUE STREAK

    if (
        data.lastLoginDate ===
        yesterdayString
    ) {

        newStreak =
            (Number(data.streak) || 0) + 1;

    }


    // STREAK REWARDS

    const rewards =
        [
            5,
            10,
            15,
            20,
            25,
            30,
            50
        ];


    const reward =
        rewards[
            Math.min(
                newStreak - 1,
                rewards.length - 1
            )
        ];


    await updateDoc(
        doc(db, "users", currentUser.uid),
        {

            streak:
                newStreak,

            lastLoginDate:
                today,

            coins:
                increment(reward),

            totalEarned:
                increment(reward)

        }
    );


    updateStreakUI(
        newStreak
    );


    const streakStatus =
        document.getElementById(
            "streakStatus"
        );


    if (streakStatus) {

        streakStatus.innerText =
            `🔥 Day ${newStreak} completed! +${reward} coins`;

    }


    alert(
        `🔥 Daily Streak Reward!\n\n` +
        `Day ${newStreak}\n` +
        `+${reward} coins`
    );

}


// ========================================
// STREAK UI
// ========================================

function updateStreakUI(streak) {

    const element =
        document.getElementById(
            "streakCount"
        );


    if (element) {

        element.innerText =
            streak;

    }

}


// ========================================
// FRIENDLY ERRORS
// ========================================

function getFriendlyError(code) {

    switch (code) {

        case "auth/email-already-in-use":

            return "This email is already registered.";


        case "auth/invalid-email":

            return "Please enter a valid email.";


        case "auth/invalid-credential":

            return "Incorrect email or password.";


        case "auth/weak-password":

            return "Password is too weak.";


        case "auth/user-not-found":

            return "No account found with this email.";


        case "auth/wrong-password":

            return "Incorrect password.";


        default:

            return "Something went wrong. Please try again.";

    }

}