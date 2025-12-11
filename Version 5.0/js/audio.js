class AudioManager {
    constructor() {
        this.sounds = {};
        this.music = {};
        this.isMuted = false;

        // Initialize sounds 

        this.loadSound('click', 'assets/sounds/click.mp3');
        this.loadSound('step', 'assets/sounds/step.mp3');
        this.loadSound('chest_open', 'assets/sounds/chest_open.mp3');
        this.loadSound('door_open', 'assets/sounds/door_open.mp3');
        this.loadSound('bg_music', 'assets/sounds/bg_music.mp3', true);
    }

    loadSound(name, path, isMusic = false) {
        const audio = new Audio(path);
        if (isMusic) {
            audio.loop = true;
            this.music[name] = audio;
        } else {
            this.sounds[name] = audio;
        }
    }

    play(name) {
        if (this.isMuted) return;

        if (this.sounds[name]) {

            const sound = this.sounds[name].cloneNode();
            sound.play().catch(e => console.log('Audio play failed (user interaction needed first):', e));
        }
    }

    playMusic(name) {
        if (this.isMuted) return;

        if (this.music[name]) {
            this.music[name].play().catch(e => console.log('Music play failed:', e));
        }
    }

    stopMusic(name) {
        if (this.music[name]) {
            this.music[name].pause();
            this.music[name].currentTime = 0;
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;

        if (this.isMuted) {
            Object.values(this.music).forEach(audio => audio.pause());

            Object.values(this.sounds).forEach(audio => {
                audio.muted = true;
                audio.pause();
                audio.currentTime = 0;
            });
        } else {

            this.playMusic('bg_music');

            Object.values(this.sounds).forEach(audio => audio.muted = false);
        }

        return this.isMuted;
    }
}

const audioManager = new AudioManager();
