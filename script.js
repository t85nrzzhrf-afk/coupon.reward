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
// HELPER
// ========================================

function getToday() {

    return new Date()
        .toISOString()
        .split("T")[0];

}


// ========================================
// AUTH STATE
// ========================================

onAuthStateChanged(auth, async (user) => {

    currentUser = user;

    if (user) {

        const loggedOut =
            document.getElementById("loggedOutNav");

        const loggedIn =
            document.getElementById("loggedInNav");

        const loginRequired =
            document.getElementById("loginRequired");


        if (loggedOut) {

            loggedOut.classList.add("hidden");

        }


        if (loggedIn) {

            loggedIn.classList.remove("hidden");

        }


        if (loginRequired) {

            loginRequired.style.display = "none";

        }


        await loadUserData();

    }

    else {

        const loggedOut =
            document.getElementById("loggedOutNav");

        const loggedIn =
            document.getElementById("loggedInNav");

        const loginRequired =
            document.getElementById("loginRequired");


        if (loggedOut) {

            loggedOut.classList.remove("hidden");

        }


        if (loggedIn) {

            loggedIn.classList.add("hidden");

        }


        if (loginRequired) {

            loginRequired.style.display = "block";

        }


        updateUI(0, 0, 0);

        updateChallengeUI({
            dailyAds: 0,
            dailySpin: 0,
            dailyRedeem: 0
        });

        updateStreakUI(0);

    }

});


// ========================================
// SIGN UP
// ========================================

window.signupUser = async function () {

    const name =
        document
        .getElementById("signupName")
        .value
        .trim();


    const email =
        document
        .getElementById("signupEmail")
        .value
        .trim();


    const password =
        document
        .getElementById("signupPassword")
        .value;


    const error =
        document
        .getElementById("signupError");


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


                // WALLET

                coins: 0,

                adsWatched: 0,

                totalEarned: 0,


                // SUBSCRIPTION

                subscription: "Free",

                subscriptionPrice: 0,

                multiplier: 1,

                subscriptionActive: false,


                // DAILY CHALLENGES

                dailyAds: 0,

                dailySpin: 0,

                dailyRedeem: 0,

                challengeDate: getToday(),


                // SPIN

                lastSpinDate: "",


                // STREAK

                lastLoginDate: "",

                streak: 0,


                createdAt:
                    new Date()

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
        document
        .getElementById("loginEmail")
        .value
        .trim();


    const password =
        document
        .getElementById("loginPassword")
        .value;


    const error =
        document
        .getElementById("loginError");


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


    if (!snapshot.exists()) return;


    let data =
        snapshot.data();


    // RESET DAILY DATA

    data =
        await resetDailyDataIfNeeded(
            data
        );


    // UPDATE STREAK

    await updateDailyStreak(
        data
    );


    // GET UPDATED DATA AGAIN

    const updatedSnapshot =
        await getDoc(userRef);


    if (!updatedSnapshot.exists()) return;


    data =
        updatedSnapshot.data();


    // UPDATE ALL UI

    updateUI(
        data.coins || 0,
        data.adsWatched || 0,
        data.totalEarned || 0
    );


    updateChallengeUI(
        data
    );


    updateStreakUI(
        data.streak || 0
    );

}


// ========================================
// DAILY RESET
// ========================================

async function resetDailyDataIfNeeded(data) {

    const today =
        getToday();


    if (
        data.challengeDate !== today
    ) {

        await updateDoc(
            doc(
                db,
                "users",
                currentUser.uid
            ),
            {

                challengeDate:
                    today,

                dailyAds:
                    0,

                dailySpin:
                    0,

                dailyRedeem:
                    0

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
                0

        };

    }


    return data;

}


// ========================================
// UPDATE MAIN UI
// ========================================

function updateUI(
    coins,
    ads,
    totalEarned = 0
) {

    const navCoins =
        document.getElementById(
            "navCoins"
        );


    const heroCoins =
        document.getElementById(
            "heroCoins"
        );


    const adsWatched =
        document.getElementById(
            "adsWatched"
        );


    const totalEarnedElement =
        document.getElementById(
            "totalEarned"
        );


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

}


// ========================================
// DAILY STREAK
// ========================================

async function updateDailyStreak(data) {

    const today =
        getToday();


    if (
        data.lastLoginDate === today
    ) {

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


    let newStreak =
        1;


    if (
        data.lastLoginDate ===
        yesterdayString
    ) {

        newStreak =
            (Number(data.streak) || 0) + 1;

    }


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
        doc(
            db,
            "users",
            currentUser.uid
        ),
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


    alert(
        `🔥 Daily Streak Reward!\n\n` +
        `Day ${newStreak}\n` +
        `+${reward} coins`
    );

}


// ========================================
// UPDATE STREAK UI
// ========================================

function updateStreakUI(streak) {

    const streakElement =
        document.getElementById(
            "streakCount"
        );


    if (streakElement) {

        streakElement.innerText =
            streak;

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
        document.getElementById(
            "adModal"
        );


    if (modal) {

        modal.style.display =
            "flex";

    }


    let timeLeft =
        10;


    const timer =
        document.getElementById(
            "timer"
        );


    if (timer) {

        timer.innerText =
            timeLeft;

    }


    const adStatus =
        document.getElementById(
            "adStatus"
        );


    if (adStatus) {

        adStatus.innerText =
            "Advertisement is playing...";

    }


    clearInterval(
        timerInterval
    );


    timerInterval =
        setInterval(
            async () => {

                timeLeft--;


                if (timer) {

                    timer.innerText =
                        timeLeft;

                }


                if (
                    timeLeft <= 0
                ) {

                    clearInterval(
                        timerInterval
                    );


                    await giveDemoReward();

                }

            },
            1000
        );

};


// ========================================
// GIVE AD REWARD
// ========================================

async function giveDemoReward() {

    if (!currentUser) return;


    const userRef =
        doc(
            db,
            "users",
            currentUser.uid
        );


    try {

        const snapshot =
            await getDoc(
                userRef
            );


        if (
            !snapshot.exists()
        ) return;


        const data =
            snapshot.data();


        const multiplier =
            Number(
                data.multiplier
            ) || 1;


        const baseReward =
            10;


        const reward =
            baseReward *
            multiplier;


        await updateDoc(
            userRef,
            {

                coins:
                    increment(
                        reward
                    ),

                adsWatched:
                    increment(
                        1
                    ),

                totalEarned:
                    increment(
                        reward
                    ),

                dailyAds:
                    increment(
                        1
                    )

            }
        );


        await loadUserData();


        const status =
            document.getElementById(
                "adStatus"
            );


        if (status) {

            status.innerText =
                `✓ Advertisement completed! +${reward} coins`;

        }

    }

    catch (error) {

        console.error(
            error
        );


        const status =
            document.getElementById(
                "adStatus"
            );


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
        document.getElementById(
            "adModal"
        );


    if (modal) {

        modal.style.display =
            "none";

    }


    clearInterval(
        timerInterval
    );

};


// ========================================
// REDEEM REWARD
// ========================================

window.redeemReward =
async function (
    requiredCoins
) {

    if (!currentUser) {

        openAuth("login");

        return;

    }


    const userRef =
        doc(
            db,
            "users",
            currentUser.uid
        );


    const snapshot =
        await getDoc(
            userRef
        );


    if (
        !snapshot.exists()
    ) return;


    const data =
        snapshot.data();


    const coins =
        Number(
            data.coins
        ) || 0;


    if (
        coins < requiredCoins
    ) {

        alert(
            `You need ${
                requiredCoins - coins
            } more coins.`
        );

        return;

    }


    await updateDoc(
        userRef,
        {

            coins:
                coins -
                requiredCoins,

            dailyRedeem:
                increment(
                    1
                )

        }
    );


    await loadUserData();


    const couponCode =
        "RX" +
        requiredCoins +
        "-DEMO";


    const couponTitle =
        document.getElementById(
            "couponTitle"
        );


    const couponCodeElement =
        document.getElementById(
            "couponCode"
        );


    const couponModal =
        document.getElementById(
            "couponModal"
        );


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

};


// ========================================
// DAILY SPIN WHEEL
// ========================================

window.spinWheel =
async function () {

    if (!currentUser) {

        openAuth(
            "login"
        );

        return;

    }


    const userRef =
        doc(
            db,
            "users",
            currentUser.uid
        );


    try {

        const snapshot =
            await getDoc(
                userRef
            );


        if (
            !snapshot.exists()
        ) return;


        const data =
            snapshot.data();


        const today =
            getToday();


        const status =
            document.getElementById(
                "spinStatus"
            );


        if (
            data.lastSpinDate ===
            today
        ) {

            if (status) {

                status.innerText =
                    "You already used your daily spin! Come back tomorrow 🎡";

            }

            return;

        }


        const button =
            document.getElementById(
                "spinButton"
            );


        if (button) {

            button.disabled =
                true;

        }


        if (status) {

            status.innerText =
                "Spinning... 🎡";

        }


        const rewards =
            [
                5,
                10,
                20,
                50
            ];


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
                Math.random() *
                1440
            );


        const wheel =
            document.getElementById(
                "spinWheel"
            );


        if (wheel) {

            wheel.style.transform =
                `rotate(${rotation}deg)`;

        }


        setTimeout(
            async function () {

                try {

                    await updateDoc(
                        userRef,
                        {

                            coins:
                                increment(
                                    reward
                                ),

                            totalEarned:
                                increment(
                                    reward
                                ),

                            lastSpinDate:
                                today,

                            dailySpin:
                                1

                        }
                    );


                    await loadUserData();


                    if (status) {

                        status.innerText =
                            `🎉 Congratulations! You won ${reward} coins!`;

                    }

                }

                catch (error) {

                    console.error(
                        error
                    );


                    if (status) {

                        status.innerText =
                            "Something went wrong.";

                    }

                }

                finally {

                    if (button) {

                        button.disabled =
                            false;

                    }

                }

            },
            5000
        );

    }

    catch (error) {

        console.error(
            error
        );


        const status =
            document.getElementById(
                "spinStatus"
            );


        if (status) {

            status.innerText =
                "Something went wrong. Please try again.";

        }


        const button =
            document.getElementById(
                "spinButton"
            );


        if (button) {

            button.disabled =
                false;

        }

    }

};


// ========================================
// AUTH UI
// ========================================

window.openAuth =
function (type) {

    const modal =
        document.getElementById(
            "authModal"
        );


    if (modal) {

        modal.style.display =
            "flex";

    }


    if (
        type === "signup"
    ) {

        showSignup();

    }

    else {

        showLogin();

    }

};


window.closeAuth =
function () {

    const modal =
        document.getElementById(
            "authModal"
        );


    if (modal) {

        modal.style.display =
            "none";

    }

};


window.showSignup =
function () {

    const login =
        document.getElementById(
            "loginForm"
        );


    const signup =
        document.getElementById(
            "signupForm"
        );


    if (login) {

        login.classList.add(
            "hidden"
        );

    }


    if (signup) {

        signup.classList.remove(
            "hidden"
        );

    }

};


window.showLogin =
function () {

    const signup =
        document.getElementById(
            "signupForm"
        );


    const login =
        document.getElementById(
            "loginForm"
        );


    if (signup) {

        signup.classList.add(
            "hidden"
        );

    }


    if (login) {

        login.classList.remove(
            "hidden"
        );

    }

};


// ========================================
// COUPON UI
// ========================================

window.closeCoupon =
function () {

    const modal =
        document.getElementById(
            "couponModal"
        );


    if (modal) {

        modal.style.display =
            "none";

    }

};


window.copyCoupon =
function () {

    const codeElement =
        document.getElementById(
            "couponCode"
        );


    if (!codeElement) return;


    const code =
        codeElement.innerText;


    navigator.clipboard
        .writeText(
            code
        );


    alert(
        "Coupon code copied!"
    );

};


// ========================================
// ADVERTISER
// ========================================

window.contactAdvertiser =
function () {

    alert(
        "Advertiser registration coming soon."
    );

};


// ========================================
// SUBSCRIPTIONS
// ========================================
// PROTOTYPE MODE

window.buySubscription =
async function (
    plan,
    price,
    multiplier
) {

    if (!currentUser) {

        openAuth(
            "login"
        );

        return;

    }


    const userRef =
        doc(
            db,
            "users",
            currentUser.uid
        );


    try {

        const confirmed =
            confirm(
                `${plan} Plan\n\n` +
                `Price: ₹${price}\n` +
                `Coin Multiplier: ${multiplier}×\n\n` +
                `Activate this prototype subscription?`
            );


        if (
            !confirmed
        ) return;


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
            `Multiplier: ${multiplier}×`
        );

    }

    catch (error) {

        console.error(
            error
        );


        alert(
            "Could not activate subscription."
        );

    }

};


// ========================================
// FRIENDLY ERRORS
// ========================================

function getFriendlyError(
    code
) {

    switch (
        code
    ) {

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