//inital disc sliding out
TweenMax.from('.discAnimate', 2, {scale: 0.9, rotation: 60, x: -290, ease: Back.easeOut, delay: 0.9});


//textbar fade in
TweenMax.from('.imageClass', 1.2, {opacity: 0, delay: 2.3});
TweenMax.from('.description', 1.2, {opacity: 0, delay: 3.1});
TweenMax.from('.buttonClass', 1.2, {opacity: 0, delay: 4});

//TweenMax.to('.textbar', 3, {x: -1000})
