const gc_docTitle = "FocusTools";

///////////////////////////
// Noises               //
//////////////////////////
var g_currentTabID = "#noises";

function switchTab(tabToOpenID) {
    let current = $(g_currentTabID);
    let tabToOpen = $(tabToOpenID);

    current.css("display", "none");
    g_currentTabID = tabToOpenID;
    tabToOpen.css("display", "");

    // If #brainstorm, switch focus to textarea
    $(g_currentTabID).find("textarea").focus();
}

function togglePlayPauseAudio(audio, btn) {
    btn.removeClass("volume" + audio.volume * 100);
    audio.volume = (audio.volume + 0.25) % 1.25;
    btn.addClass("volume" + audio.volume * 100);

    if (audio.volume < 0.01) {
        audio.pause();
        return;
    }

    if (audio.paused) {
        audio.play();
    }
}

///////////////////////////
// Timer                //
//////////////////////////
class TimerCtrl {
    constructor() {
        this.isActive = false;
        this.currentTime = "00:00:00";
        this.isPaused = false;
        this.bStop = false;
        this.btn5minClicked = false;
        this.timerTotal = "";
    }
    pause() {
        this.isPaused = true;
    }
    continue() {
        this.isPaused = false;
    }
    stop() {
        this.bStop = true;
    }
    start(hours, minutes) {
        if (this.isActive) {
            return;
        }
        this.isActive = true;
        this.currentTime = hours + ":" + minutes + ":" + "00";
        
        let tickCount_s = 0;
        let timeOutput = $("h1#time");
        timeOutput.html(this.currentTime);
        var self = this;

        let interval = setInterval(function() {
            // TODO: don't add to total time when paused
            if (self.isPaused || self.btn5minClicked) {
                return;
            }
            if (self.bStop) {
                clearInterval(interval);
                self.timerTotal = calculateTotalTime(tickCount_s);
                self.isActive = false;
                self.isPaused = false;
                self.bStop = false;

                // Disable buttons 
                $("button#plus5").prop("disabled", true);
                $("button#minus5").prop("disabled", true);

                // Restore the original title
                document.title = gc_docTitle;
                return;
            }

            let [h, m, s] = timeToInt(self.currentTime);

            if (h <= 0 && m <= 0 && s <= 0) {
                clearInterval(interval);
                self.timerTotal = calculateTotalTime(tickCount_s);
                self.isPaused = false;
                self.isActive = false;

                // Disable +-5 buttons
                $("button#plus5").prop("disabled", true);
                $("button#minus5").prop("disabled", true);

                // Add timer to the past timers list
                appendTimerToHistory(self.timerTotal);

                // Restore the original title
                document.title = gc_docTitle;

                // Move audio to class
                let successAudio = $("div#timer audio")[0];
                successAudio.play();
                return;
            }

            --s;

            m = (s < 0) ? --m : m;
            h = (m < 0) ? --h : h;

            s = (s < 0) ? 59 : s;
            s = (s < 10) ? "0" + s : s;

            m = (m < 0) ? 59 : m;
            m = (m < 10) ? "0" + m : m;

            h = (h < 10) ? "0" + h : h;

            self.currentTime = h + ":" + m + ":" + s;
            timeOutput.html(self.currentTime);
            document.title = gc_docTitle + " | " + self.currentTime;
            tickCount_s++;
        }, 1000);
    }
    btn5min(plus) {
        this.btn5minClicked = true; // prevent updating inside the interval

        let timeOutput = $("h1#time");
        let [h, m, s] = timeToInt(this.currentTime);
        // To modify total timer duration
        let [totalH, totalM, totalS] = timeToInt(this.timerTotal);

        if (plus) {
            [h, m] = add5min(h, m);
            [totalH, totalM] = add5min(totalH, totalM);
        } else {
            [h, m] = subtract5min(h, m);
            [totalH, totalM] = subtract5min(totalH, totalM);
        }

        this.currentTime = timerUnitsToTimerString(h, m, s);
        this.timerTotal  = timerUnitsToTimerString(totalH, totalM, totalS);
        timeOutput.html(this.currentTime);

        this.btn5minClicked = false;
    }
}


function calculateTotalTime(tickCount_s) {
    const h = Math.floor(tickCount_s / 3600);
    const m = Math.floor((tickCount_s % 3600) / 60);
    const s = tickCount_s % 60;

    return timerUnitsToTimerString(h, m, s);
}

function add5min(h, m) {
    m += 5;

    if (m > 59) {
        h++;
        m %= 60;
    }
    return [h, m];
}

function subtract5min(h, m) {
    m -= 5;

    if (m < 0 && h > 0) {
        m = 59;
        h--;
    } else if (m < 0) {
        m = 0;
    }
    return [h, m];
}

function timerUnitToString(unit) {
    return String(unit).padStart(2, "0");
}

function timerUnitsToTimerString(h, m, s) {
    h = timerUnitToString(h);
    m = timerUnitToString(m);
    s = timerUnitToString(s);
    return h + ":" + m + ":" + s;
}

function timeToInt(time) {
    let t = time.split(":");
    let h = parseInt(t[0]);
    let m = parseInt(t[1]);
    let s = parseInt(t[2]);

    if (isNaN(h)) { h = 0; }
    if (isNaN(m)) { m = 0; }
    if (isNaN(s)) { s = 0; }

    return [h, m, s];
}

function prepareTimerUnit(unit) {
    if (!unit) {
        return "00";
    }
    
    return timerUnitToString(unit);
}

function appendTimerToHistory(timerTotal) {
    const timerName = $("input#timer-name").val();
    const tdName = "<td>" + timerName + "</td>";
    const tdTime = "<td>" + timerTotal + "</td>";

    $("#past-timers table").append("<tr>" + tdName + tdTime + "</tr>");
}


///////////////////////////
// On Document Ready    //
//////////////////////////

$(document).ready(function() {
    setTimeout(function() {
        $("#welcome-msg").animate({opacity: "0.3"}, 2000);
    }, 5000);

    const soundButtons = [
        $("button#birds"), $("button#wind"), $("button#rain"), $("button#thunder"), $("button#fireplace"),
        $("button#white-noise"), $("button#brown-noise"), $("button#pink-noise"), $("button#fan"), $("button#train"),
        $("button#lofi"), $("button#classical"), $("button#techno"), $("button#jazz"), $("button#coffee-shop"), 
    ];

    for (let i = 0; i < soundButtons.length; i++) {
        let btn = soundButtons[i];
        let audio = btn.find("audio")[0];
        audio.volume = 0.0;

        let holdTimer = null;
        let wasHeld = false;

        // Make looping more fluent
        $(audio).on("timeupdate", function() {
            let buffer = 0.6;

            if (this.currentTime > this.duration - buffer) {
                this.currentTime = 0;
                if (!this.paused) {
                    this.play();
                }
            }
        });

        // Handle hold down - stop audio
        btn.on("mousedown", function(e) {
            wasHeld = false;
            holdTimer = setTimeout(function() {
                btn.removeClass("volume" + (audio.volume * 100));
                audio.pause();
                audio.currentTime = 0;
                audio.volume = 0;
                wasHeld = true;
            }, 500); // 500ms hold threshold
        });

        // Cancel timer on mouseup / mouseleave
        btn.on("mouseup mouseleave", function() {
            if (holdTimer) {
                clearTimeout(holdTimer);
                holdTimer = null;
            }
        });

        // Handle click - reduce volume, but only if it wasn't a hold
        btn.on("click", function(e) {
            if (wasHeld) {
                e.preventDefault(); // Cancel the click
                return;
            }
            togglePlayPauseAudio(audio, btn);
        });
    }

    // ============  Tab switching =====================
    $(".tab-button").click(function() {
        let tabToOpenID = $(this).attr("data-tabID");
        if (g_currentTabID === tabToOpenID) {
            return;
        }

        $(".tab-button").removeClass("active");
        $(this).addClass("active");

        switchTab(tabToOpenID);
    });

    // ================= Timer ==========================
    let btn5minus  = $("#minus5");
    let btn5plus   = $("#plus5");
    let timeStatus = $("#time-status");
    var Timer = new TimerCtrl();

    btn5minus.click(function() {
        Timer.btn5min(false);
    });

    btn5plus.click(function() {
        Timer.btn5min(true);
    });

    $("button#start-time").click(function() {
        if (!Timer.isPaused) {
            let h = prepareTimerUnit($("input#hours").val());
            let m = prepareTimerUnit($("input#minutes").val());
            
            btn5plus.prop("disabled", false);
            btn5minus.prop("disabled", false);
            Timer.start(h, m);
        }
        else {
            Timer.continue();
        }
        timeStatus.html("");
    });

    $("button#pause-time").click(function() {
        Timer.pause();
        timeStatus.html("Paused");
    });

    $("button#stop-time").click(function() {
        Timer.stop();
        Timer.isPaused = false;
        $("#time").html("");
        timeStatus.html("");
    });
    
    $("button#clear").click(function() {
        $("div#past-timers table tbody tr").remove();
    });


    // Prevent page refresh
    window.onbeforeunload = function() {
        return ""; // custom message does not work
    }

});