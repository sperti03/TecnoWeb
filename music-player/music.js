const cardData = [
    {
        title: "Catania",
        artist: "Giuseppe Castiglia",
        imageUrl: "ct.jpg",
        audioUrl: "ct.mp3",
    },
    {
        title: "Semu Giarrisi",
        artist: "Fratelli Tarantella",
        imageUrl: "giarre.jpg",
        audioUrl: "giarre.mp3",
    },
   {
        title: "A Megghiu Frutta",
        artist: "Savvo Zauddu",
        imageUrl: "frutta.jpg",
        audioUrl: "frutta.mp3",
    },
];

let currentIndex = 0;
const body = document.body;
const cardImage = document.getElementById("cardImage");
const cardTitle = document.getElementById("cardTitle");
const cardText = document.getElementById("cardText");
const audioPlayer = document.getElementById("audioPlayer");
const audioSource = document.getElementById("audioSource");
const playIcon = document.getElementById("playIcon");
const pauseIcon = document.getElementById("pauseIcon");
const volumeControl = document.getElementById("volumeControl");

function updateCard() {
    const { title, artist, imageUrl, audioUrl } = cardData[currentIndex];
    cardImage.src = imageUrl;
    cardTitle.textContent = title;
    cardText.textContent = artist;
    audioSource.src = audioUrl;
    audioPlayer.load();
    pauseAudio();
    setBackgroundImage(imageUrl);
}

function setBackgroundImage(url) {
    body.style.backgroundImage = `url(${url})`;
}

function toggleAudio() {
    if (audioPlayer.paused) {
        audioPlayer.play();
        playIcon.style.display = "none";
        pauseIcon.style.display = "inline";
    } else {
        audioPlayer.pause();
        playIcon.style.display = "inline";
        pauseIcon.style.display = "none";
    }
}

function previousCard() {
    currentIndex = (currentIndex - 1 + cardData.length) % cardData.length;
    updateCard();
}

function nextCard() {
    currentIndex = (currentIndex + 1) % cardData.length;
    updateCard();
}

function pauseAudio() {
    audioPlayer.pause();
    playIcon.style.display = "inline";
    pauseIcon.style.display = "none";
}

volumeControl.addEventListener("input", function() {
    audioPlayer.volume = volumeControl.value;
});

updateCard();
