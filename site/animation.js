//inital disc sliding out
TweenMax.from('.discAnimate', 2, {rotation: 60, x: -260, ease: Bounce.easeOut, delay: 0.9});


//textbar fade in
TweenMax.from('.imageClass', 1.2, {opacity: 0, delay: 2.1});
TweenMax.from('.description', 1.2, {opacity: 0, delay: 2.5});
TweenMax.from('.buttonClass', 1.2, {opacity: 0, delay: 3});

//TweenMax.to('.textbar', 3, {x: -1000})
