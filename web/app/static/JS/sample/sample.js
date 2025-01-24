/* !!!!---------------------------------- Define Properties -----------------------------------------!!!! */
state.name = "Dhairya";
state.number = "9023310098";



/* !!!!---------------------------------- Define accessors for html objects -----------------------------------------!!!! */
waiting_message = document.getElementById("waiting_screen_message");



/* !!!!---------------------------------- Add Event Listeners -----------------------------------------!!!! */
waiting_message.addEventListener("click",hide_waiting_message);



/* !!!!---------------------------------- App specific entry point -----------------------------------------!!!! */

main();

async function main(){
    console.log("hello world");
}



/* !!!!---------------------------------- Define Functions Here -----------------------------------------!!!! */
function hide_waiting_message()
{
    waiting_message.style.display='none';
}

