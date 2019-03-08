
Vue.component('concerts', {

    template: '#concerts',

    data: function() {
        return {
            concerts: [],
            nextConcert: null,
            listIsLimited: true,
            dateTest: new Date()
        }
    },
    computed: {
        concertList: function() {
            return this.listIsLimited ? this.concerts.slice(this.concerts.indexOf(this.nextConcert), this.concerts.length) : this.concerts;
        },
    },
    created: function() {

        axios.get('https://www.flowgig.com/api/bands/1/gigs').then(function (response) {

            var flowGigGigs = response.data.data;

            this.concerts = flowGigGigs.sort(function(a, b) {
                return new Date(a.date).getTime() - new Date(b.date).getTime();
            });

            // Depends on compability.js on some plattforms
            this.nextConcert = this.concerts.concat().find(function(concert) {
                return new Date(concert.date) > new Date().setHours(0,0,0,0);
            });
        
        }.bind(this)).catch(function (error) {
            console.log(error);
        });
    },
    methods: {
        limitList: function() {
            this.listIsLimited = true;
        },
        unlimitList: function() {
            this.listIsLimited = false;
        },
        timeToConcert: function(concert) {
            var concertDate = new Date(concert.date).setHours(0,0,0,0);
            var toDaysDate = new Date().setHours(0,0,0,0);
            return Math.round((concertDate - toDaysDate) / 86400000); // Days
        },
        timeSinceConcert: function(concert) {
            var concertDate = new Date(concert.date).setHours(0,0,0,0);
            var toDaysDate = new Date().setHours(0,0,0,0);
            return Math.round((toDaysDate - concertDate) / 86400000); // Days
        },
        timeToNextConcert: function() {
            return this.timeToConcert(this.nextConcert);
        }
    },
    components: {
        concert: {
            template: '#concert',
            props: ['concert'],
            data: function() {
                return {
                    showMore: false
                }
            },
            computed: {
                formattedDate: function() {
                    var date = new Date(this.concert.date);
                    return this.$root.formatDate(date);
                },
                rowStyle: function() {
                    var classes = this.isPast() ? 'past' : 'future';
                    if(!this.showMore) classes += ' end';
                    return classes;
                }
            },
            methods: {
                timeToConcert: function() {
                    return this.$parent.timeToConcert(this.concert);
                },
                timeSinceConcert: function() {
                    return this.$parent.timeSinceConcert(this.concert);
                },
                isPast: function() {
                    return new Date(this.concert.date) < new Date().setHours(0,0,0,0);
                },
                isNext: function() {
                    return this.concert == this.$parent.nextConcert;
                },
                toggleShowMore: function() {
                    if(this.concert.description)
                        this.showMore = !this.showMore;
                },

            }
        }
    }
});

Vue.component('music', {

    template: '#music',
    
    data:  function() {
        return {
            songs: ugrasSongs,
            loadedSong: '',
            player: '',
            playerSong: '',
        }
    },
    created: function() {
        this.playerSong = this.songs[0];
      //  this.loadPlayer(this.playerSong);
    },
    computed: {
        songTitle: function() {
            return this.loadedSong.title;
        },
        musicBy: function() {
            return this.loadedSong.musicBy;
        },
        lyricsBy: function() {
            return this.loadedSong.lyricsBy;
        },
        lyrics: function() {
            return this.loadedSong.lyrics;
        }
    },
    methods: {
        loadSong: function(song) {
            this.loadedSong = song;
            this.loadPlayer(song);
            this.playerSong = song;
        },
        isLoaded: function(song) {
            return this.loadedSong == song;
        },
    },
    components: {
        'song': {
            template: '#song',
            props: ['song'],
            
            data: function() {
                return {
                    showMore: false
                }
            },
            methods: {
                startInPlayer: function(song) {
                    this.$dispatch('songWantedPlayed', song);
                },
                toggleShowMore: function() {
                    this.showMore = !this.showMore;
                }
            }
        }
    }
});

Vue.component('musicplayer', {

    template: '#musicplayer',
    //props: ['song'],
    data: function() {
        return {
            songs: ugrasSongs,
            currentSong: null,
            player: null
        }
    },
    created: function() {

        if(this.$root.scIsAccessable()) {
            SC.initialize({ client_id: '5e772b572fc1d3481f55dfba503cd4bc' });
            this.load(this.songs[0]);
        }
    },
    computed: {
        currentTrackNumber: function() {
            return this.songs.indexOf(this.currentSong) + 1;
        }
    },
    methods: {
        load: function(song) {
            
            this.currentSong = song;
            
            if(this.player) {
                this.player.pause();
                this.player.seek(0);
            }
            
            var streamPath = '/tracks/' + this.currentSong.soundCloudId;
            return SC.stream(streamPath).then(function(player) {
                this.player = player;
                this.player.on('finish', function() {
                    this.next();
                }.bind(this));
            }.bind(this));
        },
        next: function() {
            // Load the first song if user skips ahead from the last song:
            var nextTrackNumber = (this.currentTrackNumber == this.songs.length) ? 1 : this.currentTrackNumber + 1;
            songToLoad = this.songs[nextTrackNumber-1];
            this.load(songToLoad).then(function() {
                this.player.play();
            }.bind(this));

        },
        previous: function() {
            var previousTrackNumber;
            if(this.player.currentTime() > 1000) {
                this.player.seek(0);
                return
            }
            // Load the last song if user skips back from the first song:
            var previousTrackNumber = (this.currentTrackNumber == 1) ? this.songs.length : this.currentTrackNumber - 1;
            songToLoad = this.songs[previousTrackNumber-1];
            this.load(songToLoad).then(function() {
                this.player.play();
            }.bind(this));
        },
        forward: function() {
            this.player.seek(this.player.currentTime() + 15000);
        },
        backward: function(){
            this.player.seek(this.player.currentTime() - 5000);
        }
    },
    events: {
        'playSong': function(song) {
            this.load(song).then(function() {
                this.player.play();
            }.bind(this));
        }
    }
});

Vue.component('about', {

    template: '#about',

});

Vue.component('contact', {

    template: '#contact',
    
    data: function() {
      return { showAll: false }
  }
});

Vue.component('bottominfo', {

    template: '#bottominfo',
    methods: {
        getCurrentYear:  function() {
            return new Date().getFullYear();
        }
    },
});

Vue.component('totoplink', {

    template: '#totoplink'
});

new Vue({

	el: 'body',

    methods: {
        formatDate: function(d) {

            var dd = d.getDate();
            if ( dd < 10 )
                dd = '0' + dd;

            var mm = d.getMonth()+1;
            if ( mm < 10 )
                mm = '0' + mm;

            var yy = d.getFullYear() % 100;
            if ( yy < 10 )
                yy = '0' + yy;

            return dd+'.'+mm+'.'+yy;
        },
        scIsAccessable: function() {
            return typeof SC !== 'undefined' && SC !== null;
        }
    },
    events: {
        'songWantedPlayed': function(song) {
           this.$broadcast('playSong', song);
        }
    }
});
