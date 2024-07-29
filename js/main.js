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
        setInterval(() => {
            document.body.style.top = 0;
        }, 100)

        // fetch("navbar.html").then(resp => {
        //     resp.text()
        //     .then(data => {
        //         document.querySelector("#navbar").innerHTML = data;
        //         new google.translate.TranslateElement(
        //             {pageLanguage: 'en'},
        //             'google_translate_element'
        //         );
                
        //     })
        // })
    if (window.location.pathname == "/pastcamps.html") {
        setInterval(() => {
            let carousels = document.getElementsByClassName("carousel")
            for (let i = 0; i < carousels.length; i++) {
                let items = carousels[i].getElementsByClassName("carousel-item")
                let indicators = carousels[i].getElementsByClassName("carousel-indicators")[0].getElementsByTagName("li")
                let active = carousels[i].getElementsByClassName("carousel-item active")[0]
                let activeIndicator = carousels[i].getElementsByClassName("carousel-indicators")[0].getElementsByClassName("active")[0]
                let index = Array.prototype.indexOf.call(items, active)
                let indicatorindex = Array.prototype.indexOf.call(indicators, activeIndicator)
                let next = items[index + 1]
                let nextIndicator = indicators[indicatorindex + 1]
                if (next) {
                    next.classList.add("active")
                    active.classList.remove("active")
                }
                else {
                    items[0].classList.add("active")
                    active.classList.remove("active")
                }
        
                if (nextIndicator) {
                    nextIndicator.classList.add("active")
                    activeIndicator.classList.remove("active")
                }
                else {
                    indicators[0].classList.add("active")
                    activeIndicator.classList.remove("active")
                }
            }
        }, 3000)


        fetch("data.json").then(resp => {
            resp.json()
            .then(data => {
                console.log(data)
                let previewimgs = data.pastcamps.june2023.previewimgs;
                let carouselimgs = data.pastcamps.june2023.carouselimgs;
                let testimonials = data.pastcamps.june2023.testimonials;
                let sponsors = data.pastcamps.june2023.sponsors;
                let prevewimgsdiv = document.getElementById("previewimgs")

                for (let i=0; i<previewimgs.length; i++) {
                    prevewimgsdiv.innerHTML += `<img class="bg-white shadow p-1 mx-auto mb-3" src="${previewimgs[i]}" style="height: 50%; width: 50% ;">`
                }

                // let carouselimgsdiv = document.getElementById("carouselimgs")
                // for (let i=0; i<carouselimgs.length; i++) {
                //     carouselimgsdiv.innerHTML += `<div class="testimonial-item bg-white text-center border p-4 wow fadeInUp" data-wow-delay="0.1s">
                //     <img class= "bg-white shadow p-1 mx-auto mb-3" src="${carouselimgs[i]}" style="height: 100%; width: 100%;">
                    
                // </div>`
                // }

                // let testimonialsdiv = document.getElementById("testimonials")
                // for (let i=0; i<testimonials.length; i++) {
                //     testimonialsdiv.innerHTML += `<div class="testimonial-quote bg-white text-center border p-4" style="border-radius:1rem;">
                //     <i class="fa fa-2x fa-quote-left text-primary mb-1"></i>              
                //     <p class="mb-0">${testimonials[i].quote}</p>
                //     <i class="fa fa-2x fa-quote-right text-primary mt-1"></i>     
                //     <h6>- ${testimonials[i].author}</h6>
                // </div>`
                // }

                let sponsorsdiv = document.getElementById("sponsors")
                for (let i=0; i<sponsors.length; i++) {
                    sponsorsdiv.innerHTML += `<div class="col-lg-2 col-md-3 wow fadeInUp" data-wow-delay="0.4s">
                    <div class="package-item">
                        <div class="overflow-hidden imgwrapper">
                            <img class="img-fluid" src="${sponsors[i]}" style="max-height: 500px;"   alt="">
                        </div>
        
                    </div>
                </div>`
                }
        })
    })
}

    if (window.location.pathname == "/" || window.location.pathname == "/index.html") {
    fetch("data.json").then(resp => {
        resp.json()
        .then(data => {
            console.log(data)
            let team = data.team;
            let teamGrid = document.getElementById("team_grid")
            console.log(teamGrid)
            for (const [role, people] of Object.entries(team)) {
                for (let i=0; i<people.length; i++) {
                    console.log(role)
                    teamGrid.innerHTML += `<div class="col-lg-3 col-md-6 wow fadeInUp  ${role}" data-wow-delay="${people[i].fadeDelay}s">
                        <div class="team-item">
                            <div class="overflow-hidden imgwrapper">
                                <img class="img-fluid" src="${people[i].image}" style="max-height: 300px; max-width: 300px  ;" alt="">
                            </div>
                            <div class="position-relative d-flex justify-content-center" style="margin-top: -19px;">
                                <!-- <a class="btn btn-square mx-1" href=""><i class="fab fa-facebook-f"></i></a> -->
                                <a class="btn btn-square mx-1" href="mailto:${people[i].email}"><i class="fa fa-envelope"></i></a>
                                <!-- <a class="btn btn-square mx-1" href=""><i class="fab fa-instagram"></i></a> -->
                            </div>
                            <div class="text-center p-4">
                                <h5 class="mb-0">${people[i].name}</h5>
                                <small>${people[i].role}</small>
                            </div>
                        </div>
                    </div>`
                }
              }
            
            let directors = Array(document.getElementsByClassName("directors"))
            let teachers = Array(document.getElementsByClassName("teachers"))

            let all = directors.concat(teachers)
            console.log(all)
            for (let i=0; i<all.length; i++) {
                for (let j=0; j<all[i].length; j++) {
                    all[i][j].style.display = "none"
                }
            }
        })
    })

    document.getElementById("execteam").addEventListener("click", function() {
        document.getElementById("directors").classList.remove("active")
        document.getElementById("teachers").classList.remove("active")
        document.getElementById("execteam").classList.add("active")
        let execteam = document.getElementsByClassName("execteam")
        let directors = document.getElementsByClassName("directors")
        let teachers = document.getElementsByClassName("teachers")
        for (let i=0; i<execteam.length; i++) {
            execteam[i].style.display = "block"
        }
        for (let i=0; i<directors.length; i++) {
            directors[i].style.display = "none"
        }
        for (let i=0; i<teachers.length; i++) {
            teachers[i].style.display = "none"
        }
    })

    document.getElementById("directors").addEventListener("click", function() {
        document.getElementById("directors").classList.add("active")
        document.getElementById("teachers").classList.remove("active")
        document.getElementById("execteam").classList.remove("active")
        let execteam = document.getElementsByClassName("execteam")
        let directors = document.getElementsByClassName("directors")
        let teachers = document.getElementsByClassName("teachers")
        for (let i=0; i<execteam.length; i++) {
            execteam[i].style.display = "none"
        }
        for (let i=0; i<directors.length; i++) {
            directors[i].style.display = "block"
        }
        for (let i=0; i<teachers.length; i++) {
            teachers[i].style.display = "none"
        }
    })

    document.getElementById("teachers").addEventListener("click", function() {
        document.getElementById("directors").classList.remove("active")
        document.getElementById("teachers").classList.add("active")
        document.getElementById("execteam").classList.remove("active")
        let execteam = document.getElementsByClassName("execteam")
        let directors = document.getElementsByClassName("directors")
        let teachers = document.getElementsByClassName("teachers")
        for (let i=0; i<execteam.length; i++) {
            execteam[i].style.display = "none"
        }
        for (let i=0; i<directors.length; i++) {
            directors[i].style.display = "none"
        }
        for (let i=0; i<teachers.length; i++) {
            teachers[i].style.display = "block"
        }
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