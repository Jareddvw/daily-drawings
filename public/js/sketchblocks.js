$(document).ready(function(e) {

    var history = localStorage.getItem("history")
    console.log(history)

    for (var i = 0; i < 31; i += 1) {
        if (history % 2 == 1) {
            $(".boxes").prepend('<a href="/" class="box full"></a>')
        } else {
            $(".boxes").prepend('<div class="box empty"></div>')
        }
        history = history >>> 1
    }
})