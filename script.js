let coins = 0;
let adsWatched = 0;

let timerInterval;


// Load saved data

window.onload = function () {

    coins = Number(localStorage.getItem("coins")) || 0;

    adsWatched =
        Number(localStorage.getItem("adsWatched")) || 0;

    updateUI();

};


// Update screen

function updateUI() {

    document.getElementById("navCoins").innerText = coins;

    document.getElementById("heroCoins").innerText = coins;

    document.getElementById("adsWatched").innerText =
        adsWatched;

    document.getElementById("totalEarned").innerText =
        coins;

}


// Start advertisement

function startAd() {

    const modal =
        document.getElementById("adModal");

    modal.style.display = "flex";

    let timeLeft = 10;

    document.getElementById("timer").innerText =
        timeLeft;

    document.getElementById("adStatus").innerText =
        "Advertisement is playing...";

    clearInterval(timerInterval);

    timerInterval = setInterval(function () {

        timeLeft--;

        document.getElementById("timer").innerText =
            timeLeft;

        if (timeLeft <= 0) {

            clearInterval(timerInterval);

            coins += 10;

            adsWatched++;

            localStorage.setItem(
                "coins",
                coins
            );

            localStorage.setItem(
                "adsWatched",
                adsWatched
            );

            updateUI();

            document.getElementById("adStatus").innerText =
                "✓ Advertisement completed! You earned 10 coins.";

        }

    }, 1000);

}


// Close advertisement

function closeAd() {

    document.getElementById("adModal")
        .style.display = "none";

    clearInterval(timerInterval);

}


// Redeem reward

function redeemReward(requiredCoins) {

    if (coins >= requiredCoins) {

        coins -= requiredCoins;

        localStorage.setItem(
            "coins",
            coins
        );

        updateUI();

        alert(
            "🎉 Reward unlocked successfully!"
        );

    } else {

        alert(
            "❌ You need " +
            (requiredCoins - coins) +
            " more coins."
        );

    }

}


// Advertiser button

function contactAdvertiser() {

    alert(
        "Thank you for your interest! " +
        "Our advertising team will contact you."
    );

}