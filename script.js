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
// CURRENT USER
// ========================================

let currentUser = null;

let timerInterval;


// ========================================
// AUTH STATE
// ========================================

onAuthStateChanged(auth, async (user) => {

    currentUser = user;

    if (user) {

        document
            .getElementById("loggedOutNav")
            .classList.add("hidden");

        document
            .getElementById("loggedInNav")
            .classList.remove("hidden");

        document
            .getElementById("loginRequired")
            .style.display = "none";

        await loadUserData();

    } else {

        document
            .getElementById("loggedOutNav")
            .classList.remove("hidden");

        document
            .getElementById("loggedInNav")
            .classList.add("hidden");

        document
            .getElementById("loginRequired")
            .style.display = "block";

        updateUI(0, 0);

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

                dailyChallengeProgress: 0,
                dailyChallengeCompleted: false,

                lastLoginDate: "",
                streak: 0,

                createdAt: new Date()
            }
        );


        alert(
            "Account created successfully!"
        );

        closeAuth();

    }

    catch (err) {

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

        error.innerText =
            getFriendlyError(err.code);

    }

};


// ========================================
// LOGOUT
// ========================================

window.logout = async function () {

    await signOut(auth);

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


    if (snapshot.exists()) {

        let data = snapshot.data();

        data =
            await resetDailyDataIfNeeded(data);

        await updateDailyStreak(data);

        await loadUserDataAfterStreak();

    }

}
async function loadUserDataAfterStreak() {

    const userRef =
        doc(db, "users", currentUser.uid);

    const snapshot =
        await getDoc(userRef);

    if (!snapshot.exists()) return;

    const data =
        snapshot.data();

    updateUI(
        data.coins || 0,
        data.adsWatched || 0
    );

    updateChallengeUI(data);

    updateStreakUI(
        data.streak || 0
    );

}

// ========================================
// UPDATE UI
// ========================================

function updateUI(coins, ads) {

    document.getElementById("navCoins")
        .innerText = coins;

    document.getElementById("heroCoins")
        .innerText = coins;

    document.getElementById("adsWatched")
        .innerText = ads;

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

    modal.style.display = "flex";


    let timeLeft = 10;


    document.getElementById("timer")
        .innerText = timeLeft;


    document.getElementById("adStatus")
        .innerText =
        "Advertisement is playing...";


    clearInterval(timerInterval);


    timerInterval =
        setInterval(async () => {

            timeLeft--;


            document.getElementById("timer")
                .innerText = timeLeft;


            if (timeLeft <= 0) {

                clearInterval(timerInterval);

                await giveDemoReward();

            }

        }, 1000);

};


// ========================================
// DEMO REWARD WITH MULTIPLIER
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


        // Get user's multiplier
        // Free users = 1x
        const multiplier =
            Number(data.multiplier) || 1;


        // Normal ad reward
        const baseReward = 10;


        // Apply subscription multiplier
        const reward =
            baseReward * multiplier;


        await updateDoc(userRef, {

            coins: increment(reward),

            adsWatched: increment(1),

            totalEarned: increment(reward),

            dailyAds: increment(1)


        });


        await loadUserData();


        document.getElementById("adStatus")
            .innerText =
            `✓ Advertisement completed! +${reward} coins`;


    }

    catch (error) {

        console.error(error);

        document.getElementById("adStatus")
            .innerText =
            "Something went wrong.";

    }

}


// ========================================
// CLOSE AD
// ========================================

window.closeAd = function () {

    document.getElementById("adModal")
        .style.display = "none";

    clearInterval(timerInterval);

};


// ========================================
// REDEEM
// ========================================

window.redeemReward = async function (requiredCoins) {

    if (!currentUser) {

        openAuth("login");

        return;
    }


    const userRef =
        doc(db, "users", currentUser.uid);


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


    await updateDoc(userRef, {

        coins: coins - requiredCoins,
        dailyRedeem: increment(1)

    });


    await loadUserData();


    // Generate demo coupon
    const couponCode =
        "RX" +
        requiredCoins +
        "-DEMO";


    document.getElementById("couponTitle")
        .innerText =
        `₹${requiredCoins} OFF`;


    document.getElementById("couponCode")
        .innerText =
        couponCode;


    document.getElementById("couponModal")
        .style.display =
        "flex";

};


// ========================================
// AUTH UI
// ========================================

window.openAuth = function (type) {

    document.getElementById("authModal")
        .style.display = "flex";


    if (type === "signup") {

        showSignup();

    } else {

        showLogin();

    }

};


window.closeAuth = function () {

    document.getElementById("authModal")
        .style.display = "none";

};


window.showSignup = function () {

    document.getElementById("loginForm")
        .classList.add("hidden");

    document.getElementById("signupForm")
        .classList.remove("hidden");

};


window.showLogin = function () {

    document.getElementById("signupForm")
        .classList.add("hidden");

    document.getElementById("loginForm")
        .classList.remove("hidden");

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

    document.getElementById("couponModal")
        .style.display = "none";

};


window.copyCoupon = function () {

    const code =
        document.getElementById("couponCode")
        .innerText;


    navigator.clipboard.writeText(code);


    alert("Coupon code copied!");

};


// ========================================
// SUBSCRIPTIONS
// ========================================
// PROTOTYPE ONLY
// No real payment is taken here.

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


        await updateDoc(userRef, {

            subscription: plan,

            subscriptionPrice: price,

            multiplier: multiplier,

            subscriptionActive: true

        });


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
            "Could not activate subscription.\n" +
            "Please check Firebase permissions."
        );

    }

};


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

        default:
            return "Something went wrong. Please try again.";

    }

}
// ========================================
// DAILY SPIN WHEEL
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


        // Get today's date
        const today =
            new Date()
            .toISOString()
            .split("T")[0];


        // Check if user already spun today
        if (
            data.lastSpinDate === today
        ) {

            document
                .getElementById("spinStatus")
                .innerText =
                "You already used your daily spin! Come back tomorrow 🎡";

            return;

        }


        const button =
            document
                .getElementById("spinButton");


        button.disabled = true;


        document
            .getElementById("spinStatus")
            .innerText =
            "Spinning... 🎡";


        // Possible rewards
        const rewards =
            [5, 10, 20, 50];


        // Random reward
        const reward =
            rewards[
                Math.floor(
                    Math.random() *
                    rewards.length
                )
            ];


        // Random rotation
        const rotation =
            1800 +
            Math.floor(
                Math.random() * 1440
            );


        const wheel =
            document
                .getElementById("spinWheel");


        wheel.style.transform =
            `rotate(${rotation}deg)`;


        // Wait for animation
        setTimeout(
            async function () {


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
                    `🎉 Congratulations! You won ${reward} coins!`;


                button.disabled = false;


            },
            5000
        );


    }

    catch (error) {

        console.error(error);


        document
            .getElementById("spinStatus")
            .innerText =
            "Something went wrong. Please try again.";


        document
            .getElementById("spinButton")
            .disabled =
            false;

    }

};
// ========================================
// DAILY DATE HELPER
// ========================================

function getToday() {

    return new Date()
        .toISOString()
        .split("T")[0];

}


// ========================================
// DAILY DATA RESET
// ========================================

async function resetDailyDataIfNeeded(data) {

    const today = getToday();

    if (data.challengeDate !== today) {

        await updateDoc(
            doc(db, "users", currentUser.uid),
            {
                challengeDate: today,
                dailyAds: 0,
                dailySpin: 0,
                dailyRedeem: 0
            }
        );

        return {
            ...data,
            challengeDate: today,
            dailyAds: 0,
            dailySpin: 0,
            dailyRedeem: 0
        };

    }

    return data;

}


// ========================================
// UPDATE CHALLENGE UI
// ========================================

function updateChallengeUI(data) {

    const ads =
        Math.min(Number(data.dailyAds) || 0, 3);

    const spin =
        Math.min(Number(data.dailySpin) || 0, 1);

    const redeem =
        Math.min(Number(data.dailyRedeem) || 0, 1);


    document
        .getElementById("adChallengeProgress")
        .innerText =
        `${ads} / 3`;

    document
        .getElementById("spinChallengeProgress")
        .innerText =
        `${spin} / 1`;

    document
        .getElementById("redeemChallengeProgress")
        .innerText =
        `${redeem} / 1`;


    document
        .getElementById("adChallengeBar")
        .style.width =
        `${(ads / 3) * 100}%`;

    document
        .getElementById("spinChallengeBar")
        .style.width =
        `${spin * 100}%`;

    document
        .getElementById("redeemChallengeBar")
        .style.width =
        `${redeem * 100}%`;

}


// ========================================
// DAILY STREAK
// ========================================

async function updateDailyStreak(data) {

    const today = getToday();

    if (data.lastLoginDate === today) {

        updateStreakUI(data.streak || 0);

        return;

    }


    const yesterday =
        new Date();

    yesterday.setDate(
        yesterday.getDate() - 1
    );

    const yesterdayString =
        yesterday
        .toISOString()
        .split("T")[0];


    let newStreak = 1;

    if (
        data.lastLoginDate ===
        yesterdayString
    ) {

        newStreak =
            (Number(data.streak) || 0) + 1;

    }


    const rewards =
        [5, 10, 15, 20, 25, 30, 50];

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
            streak: newStreak,
            lastLoginDate: today,
            coins: increment(reward),
            totalEarned: increment(reward)
        }
    );


    updateStreakUI(newStreak);


    alert(
        `🔥 Daily streak reward!\n\n` +
        `Day ${newStreak}\n` +
        `+${reward} coins`
    );

}


// ========================================
// UPDATE STREAK UI
// ========================================

function updateStreakUI(streak) {

    document
        .getElementById("streakCount")
        .innerText =
        streak;

}