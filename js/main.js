(function ($) {
    "use strict";

    $(window).scroll(function () {
        if ($(this).scrollTop() > 45) {
            $('.navbar').addClass('sticky-top shadow-sm');
        } else {
            $('.navbar').removeClass('sticky-top shadow-sm');
        }
    });
    
    const $dropdown = $(".dropdown");
    const $dropdownToggle = $(".dropdown-toggle");
    const $dropdownMenu = $(".dropdown-menu");
    const showClass = "show";

    // function expandContract() {
    //     const el = document.getElementById("shorter")
    //     el.classList.toggle('expanded')
    //     el.classList.toggle('collapsed')
    //     const el = document.getElementById("longer")
    //     el.classList.toggle('expanded')
    //     el.classList.toggle('collapsed')
    //  }
  
    $(window).on("load resize", function() {
        if (this.matchMedia("(min-width: 1067px)").matches) {
            $dropdown.hover(
            function() {
                const $this = $(this);
                $this.addClass(showClass);
                $this.find($dropdownToggle).attr("aria-expanded", "true");
                $this.find($dropdownMenu).addClass(showClass);
            },
            function() {
                const $this = $(this);
                $this.removeClass(showClass);
                $this.find($dropdownToggle).attr("aria-expanded", "false");
                $this.find($dropdownMenu).removeClass(showClass);
            }
            );
        } else {
            $dropdown.off("mouseenter mouseleave");
        }
    });
    
    $(window).scroll(function () {
        if ($(this).scrollTop() > 300) {
            $('.back-to-top').fadeIn('slow');
        } else {
            $('.back-to-top').fadeOut('slow');
        }
    });
    $('.back-to-top').click(function () {
        $('html, body').animate({scrollTop: 0}, 1500, 'easeInOutExpo');
        return false;
    });

    window.addEventListener('load', function () {
        fetch("navbar.html").then(resp => {
            resp.text()
            .then(data => {
                document.querySelector("#navbar").innerHTML = data;
                new google.translate.TranslateElement(
                    {pageLanguage: 'en'},
                    'google_translate_element'
                );
            })
        })
    if (window.location.pathname == "/") {
    fetch("data.json").then(resp => {
        resp.json()
        .then(data => {
            console.log(data)
            let team = data.team;
            let teamGrid = document.getElementById("team_grid")
            console.log(teamGrid)
            for (let i=0; i<team.length; i++) {
                teamGrid.innerHTML += `<div class="col-lg-3 col-md-6 wow fadeInUp" data-wow-delay="${team[i].fadeDelay}s">
                <div class="team-item">
                    <div class="overflow-hidden imgwrapper">
                        <img class="img-fluid" src="${team[i].image}" style="max-height: 300px; max-width: 300px  ;" alt="">
                    </div>
                    <div class="position-relative d-flex justify-content-center" style="margin-top: -19px;">
                        <!-- <a class="btn btn-square mx-1" href=""><i class="fab fa-facebook-f"></i></a> -->
                        <a class="btn btn-square mx-1" href="mailto:${team[i].email}"><i class="fa fa-envelope"></i></a>
                        <!-- <a class="btn btn-square mx-1" href=""><i class="fab fa-instagram"></i></a> -->
                    </div>
                    <div class="text-center p-4">
                        <h5 class="mb-0">${team[i].name}</h5>
                        <small>${team[i].role}</small>
                    </div>
                </div>
            </div>`
            }
        })
    })
}

    $( "#moreBtn" ).click(function() {
        var $this = $(this);
        $this.toggleClass("open");

        if ($this.hasClass("open")) {
            $this.html("Less");
            $("#dots").css("display", "none");
        } else {
            $this.html("Read more");
        $("#dots").css("display", "inline");
        }
        $( "#more" ).slideToggle( "fast" );
      });
    });
 
})(jQuery);