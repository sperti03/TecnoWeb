const cardData = [
    {
        title: "Catania",
        artist: "Giuseppe Castiglia",
        imageUrl: "https://i.scdn.co/image/ab67616d0000b273b7634254914c42ba68c0f5f0",
        audioUrl: "ct.mp3",
        backimg: "https://i.scdn.co/image/ab67616d0000b273b7634254914c42ba68c0f5f0",
    },
    {
        title: "Semu Giarrisi",
        artist: "Fratelli Tarantella",
        imageUrl: "https://i.scdn.co/image/ab67616d0000b2737ba24b8b670a38e814ae3838",
        audioUrl: "giarre.mp3",
        backimg: "https://i.scdn.co/image/ab67616d0000b2737ba24b8b670a38e814ae3838"

    },
   {
        title: "A Megghiu Frutta",
        artist: "Savvo Zauddu",
        imageUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/44/8a/17/448a17c1-6b86-ec95-c124-f0268be05eb8/cover.jpg/1200x1200bf-60.jpg",
        audioUrl: "frutta.mp3",
        backimg: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/44/8a/17/448a17c1-6b86-ec95-c124-f0268be05eb8/cover.jpg/1200x1200bf-60.jpg",
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
const backimage = document.getElementById("backimg");
const seekBar = document.getElementById("seekBar");

seekBar.addEventListener("input", function() {
    const newPosition = this.value;
    audioPlayer.currentTime = newPosition;
});

audioPlayer.addEventListener("timeupdate", function() {
    seekBar.value = this.currentTime;
});

function updateCard() {
    const { title, artist, imageUrl, audioUrl, backimg } = cardData[currentIndex];
    cardImage.src = imageUrl;
    cardTitle.textContent = title;
    cardText.textContent = artist;
    audioSource.src = audioUrl;
    audioPlayer.load();
    pauseAudio();
    setBackgroundImage(backimg);
}

function setBackgroundImage(url) {
    const backgroundImage = document.getElementById("backgroundImage");
    backgroundImage.style.backgroundImage = `url(${url})`;
    backgroundImage.style.filter = "blur(5px)"; // Cambia il valore per ottenere l'effetto desiderato
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
