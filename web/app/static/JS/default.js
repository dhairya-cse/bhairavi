// !!!!---------------------------------- utility functions are defined here -----------------------------------------!!!!

// Helper function to load all the scripts
function loadScript(src) {
    return new Promise(function(resolve, reject) {
      let script = document.createElement('script');
      script.src = src;
  
      script.onload = () => resolve(script);
      script.onerror = () => reject(new Error(`Script load error for ${src}`));
  
      document.head.append(script);
    });
}

// Function to check the browser name
function detectBrowser() { 
    if((navigator.userAgent.indexOf("Opera") || navigator.userAgent.indexOf('OPR')) != -1 ) {
        return 'Opera';
    } else if(navigator.userAgent.indexOf("Chrome") != -1 ) {
        return 'Chrome';
    } else if(navigator.userAgent.indexOf("Safari") != -1) {
        return 'Safari';
    } else if(navigator.userAgent.indexOf("Firefox") != -1 ){
        return 'Firefox';
    } else if((navigator.userAgent.indexOf("MSIE") != -1 ) || (!!document.documentMode == true )) {
        return 'IE';
    } else {
        return 'Unknown';
    }
}

    const sleep = time => new Promise(resolve => setTimeout(resolve, time));


class Timer {
    constructor() {
        this.start_time = new Date();
        this.getTime = function () {
            this.current_time = new Date();
            return render_time(this.current_time - this.start_time);
        };
        this.getTimeTicks = function () {
            this.current_time = new Date();
            return this.current_time - this.start_time; //in milliseconds
        };
    }
}

function pad2(number)
{
        number = '0' + number;
        return number.substr(number.length - 2);
}

function render_time(ticks)
{
    var seconds = parseInt(ticks/1000); 
    var hour = Math.floor(seconds / 3600);
    var minute = Math.floor((seconds / 60) % 60);
    var second = seconds % 60;

    var result = pad2(hour) + ':' + pad2(minute) + ':' + pad2(second)
    return result;
}

const __log = console.log;

site_stats = {}

async function timeit(callback,message)
{
    let timeit = new Timer();
    let res = await callback();
    let timetaken = timeit.getTimeTicks()
    __log(`Taken ${timetaken} ms for ${message}`);

    site_stats[message] = timetaken;

    return res;
}

function get_screens_container(initial_screen=null)
{
    // The main view port where different views loads up.
    let app_screen = {
        active: null,
        
        change_screen: function(screen_name){
            let change_to = document.getElementById(screen_name);
            let current  = document.getElementById(this.active);


            if(change_to){
                change_to.style.display = "block";
                this.active = screen_name;
            }
            else{
                return
            }


            if(current && current!=change_to) current.style.display="none";
        },
        
        render_wait_screen:async function(callback,message="Loading",message2=false){
            //render wait screen for a Promised callback.
            let current = this.active;
            this.change_screen("waiting_screen");
            document.getElementById("waiting_screen_message").innerHTML = `Please wait. ${message}...`;
            if(!message2) message2=message;
            await timeit(callback,message2);
            this.change_screen(current);
        },

        get_current_screen: function () {return document.getElementById(this.active)},
        disable: function(){
            let current = document.getElementById(this.active);
            current.style.display="none";
            this.active=null;
        }
    }

    app_screen.change_screen(initial_screen);

    return app_screen;
}


function createFlasher(whereto='flash_area')
{
    var colors={
        error:'w3-red',
        success:'w3-green',
        info:'w3-blue',
        warning:'w3-yellow',
        default:'w3-pink'
    }
    
    function createElementFromHTML(htmlstring)
    {
        var div = document.createElement('div');
        div.innerHTML = htmlstring;
        return div.firstChild;
    }
    
    function generate_flash(message,color)
    {
        return  `<div class="w3-panel ${color} w3-display-container  w3-animate-opacity" style="padding:0px;">
                        <span onclick="this.parentElement.style.display='none'"
                        class="w3-button w3-opacity-min w3-display-topright">&times;</span>
                        <p>${message}</p>
                    </div>
                `
    }

    async function hideme(ele)
    {
        await sleep(5000);
        ele.style.display='none';
    }

    function render_flash(where,what,color,hide)
    {   
        var ele = createElementFromHTML(generate_flash(what,color));
        if(hide) hideme(ele);
        where.appendChild(ele);
    }

    let flasher={
        element: document.getElementById(whereto),
        error: function(message,hide=true){
            render_flash(this.element,message,colors.error,hide);
        },
        info: function(message,hide=true){
            render_flash(this.element,message,colors.info,hide);
        },
        warning: function(message,hide=true){
            render_flash(this.element,message,colors.warning,hide);
        },
        success: function(message,hide=true){
            render_flash(this.element,message,colors.success,hide);
        },
        default: function(message,hide=true){
            render_flash(this.element,message,colors.default,hide);
        },
        flash: function(message,hide=true){
            if(Array.isArray(message)){
                var mtype = message[1];
                message = message[0];
            }
            else{
                var mtype = "default";
            }

            switch(mtype)
            {
                case "error":
                    this.error(message,hide);
                    break;
                case "info":
                    this.info(message,hide);
                    break;
                case "warning":
                    this.warning(message,hide);
                    break;
                case "success":
                    this.success(message,hide);
                    break;
                case "default":
                default:
                    this.default(message,hide);
            }
        }

    }

    
    return flasher;
}


// !!!!---------------------------------- Do the document specific task here -----------------------------------------!!!!
document.addEventListener("DOMContentLoaded",document_loaded);

async function document_loaded()
{
    flasher = createFlasher();
    browserName = detectBrowser()
    if(browserName=="IE" || browserName=="Unknown")
    {
        flasher.error("This Browser is not yet supported, Aborting...");
        return;        
    }


    for(var message of messages)
    {
           flasher.flash(message);
    }


    app_screen = get_screens_container(state.default_screen);
    
    
    if(!scripts_to_load) scripts_to_load = []
    state.script_promises = [];

    for(script of scripts_to_load)
    {
        state.script_promises.push(loadScript(script));
    }
}