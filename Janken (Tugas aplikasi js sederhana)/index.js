var getComp = function () {
	var comp = Math.random();
	if (comp < 0.34) return 'batu';
	if (comp >= 0.34 && comp < 0.67) return 'kertas';
	return 'gunting';
}

var getRules = function (comp, user) {
	if (user == comp) return 'Seri !';
	if (user == 'batu') return (comp == 'gunting') ? 'Menang !' : 'Kalah !';
	if (user == 'kertas') return (comp == 'batu') ? 'Menang !' : 'Kalah !';
	if (user == 'gunting') return (comp == 'batu') ? 'Kalah ! ' : 'Menang !';
}


var mikir = function () {
	const imgCompu =document.querySelector('.img-komputer');
	const gambar = ['batu2', 'kertas2', 'gunting2'];
	let i =0;
	const wakMulai = new Date().getTime();

	setInterval(function(){
		if ( new Date().getTime()- wakMulai > 1000) {
			clearInterval;
			return;
		}

		imgCompu.setAttribute('src', 'img/' + gambar[i++] +'.png');
		if (i == gambar.length) i = 0;
	}, 100)
}


const pilih = document.querySelectorAll('li img');
pilih.forEach(function(milih){
	milih.addEventListener('click', function(){
		const pComp = getComp();
		const pUser = milih.className;
		const hasil = getRules(pComp, pUser);
		
		mikir();

		setTimeout(function(){
			const imgComp = document.querySelector('.img-komputer');
			imgComp.setAttribute('src', 'img/' + pComp + '2.png');

			const info = document.querySelector('.info');
			info.innerHTML = hasil;
		}, 1000);

	});

});


// BIKIN Score GBLK 