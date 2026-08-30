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

        const data =
            snapshot.data();


        updateUI(
            data.coins || 0,
            data.adsWatched || 0
        );

    }

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


                /*
                 * DEMO REWARD
                 *
                 * Production version should
                 * validate ad completion on
                 * a trusted backend.
                 */

                await giveDemoReward();

            }

        }, 1000);

};


// ========================================
// DEMO REWARD
// ========================================

async function giveDemoReward() {

    if (!currentUser) return;


    const userRef =
        doc(db, "users", currentUser.uid);


    try {

        await updateDoc(userRef, {

            coins: increment(10),

            adsWatched: increment(1),

            totalEarned: increment(10)

        });


        await loadUserData();


        document.getElementById("adStatus")
            .innerText =
            "✓ Advertisement completed! +10 coins";


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
        data.coins || 0;


    if (coins < requiredCoins) {

        alert(
            `You need ${requiredCoins - coins} more coins.`
        );

        return;
    }


    await updateDoc(userRef, {

        coins: coins - requiredCoins

    });


    await loadUserData();


    alert(
        "🎉 Reward successfully unlocked!"
    );

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