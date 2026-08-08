jQuery(function ($) {

	//TOPayment.html page 
	$("#rdoVehicleOnly_1").click(function () {
		$("#display").hide(1000);
	});
	$("#rdoVehicleOnly_0").click(function () {
		$("#display").show(1000);
	});
	$("#flip").click(function () {
		$("#panel").slideToggle(1000);
	});


	// accordian
	$('.accordion-toggle').on('click', function () {
		$(this).closest('.panel-group').children().each(function () {
			$(this).find('>.panel-heading').removeClass('active');
		});

		$(this).closest('.panel-heading').toggleClass('active');
	});


	$(function () {

		var $active = true;

		$('.panel-title > a').click(function (e) {
			e.preventDefault();
		});

		$('.collapse-init').on('click', function () {
			if (!$active) {
				$active = true;
				$('.panel-title > a').attr('data-toggle', 'collapse');
				$('.panel-collapse').collapse('hide');
				$(this).html('إظهار الكل');
			} else {
				$active = false;
				$('.panel-collapse').collapse('show');
				$('.panel-title > a').attr('data-toggle', '');
				$(this).html('إخفاء الكل');
			}
		});

	});

	$(function () {

		$('.collapse').on('shown.bs.collapse', function () {
			$(this).parent().find('.fa-angle-down').removeClass('fa-angle-down').addClass('fa-angle-up');
		}).on('hidden.bs.collapse', function () {
			$(this).parent().find('.fa-angle-up').removeClass('fa-angle-up').addClass('fa-angle-down');
		});
		$('.collapse').on('shown.bs.collapse', function () {
			$(this).parent().find('.fa-angle-left').removeClass('fa-angle-left').addClass('fa-angle-right');
		}).on('hidden.bs.collapse', function () {
			$(this).parent().find('.fa-angle-right').removeClass('fa-angle-right').addClass('fa-angle-left');

		});
	});





	//Model JS
	// Get the modal
	var modal = document.getElementById('myModal');

	// Get the image and insert it inside the modal - use its "alt" text as a caption

	var modalImg = document.getElementById("img01");
	var captionText = document.getElementById("caption");
	//document.getElementById('myImg').addEventListener('click', function () {
	//	modal.style.display = "block";
	//	modalImg.src = this.src;
	//	modalImg.alt = this.alt;
	//	captionText.innerHTML = this.alt;
	//});



	// Get the <span> element that closes the modal
	var span = document.getElementsByClassName("close")[0];

	// When the user clicks on <span> (x), close the modal
	//span.onclick = function () {
	//	modal.style.display = "none";
	//}


	//Initiat WOW JS
	new WOW().init();

	// portfolio filter
	$(window).load(function () {
		'use strict';
		var $portfolio_selectors = $('.portfolio-filter >li>a');
		var $portfolio = $('.portfolio-items');
		$portfolio.isotope({
			itemSelector: '.portfolio-item',
			layoutMode: 'fitRows'
		});

		$portfolio_selectors.on('click', function () {
			$portfolio_selectors.removeClass('active');
			$(this).addClass('active');
			var selector = $(this).attr('data-filter');
			$portfolio.isotope({ filter: selector });
			return false;
		});
	});

	// Contact form
	var form = $('#main-contact-form');
	form.submit(function (event) {
		event.preventDefault();
		var form_status = $('<div class="form_status"></div>');
		$.ajax({
			url: $(this).attr('action'),

			beforeSend: function () {
				form.prepend(form_status.html('<p><i class="fa fa-spinner fa-spin"></i> Email is sending...</p>').fadeIn());
			}
		}).done(function (data) {
			form_status.html('<p class="text-success">' + data.message + '</p>').delay(3000).fadeOut();
		});
	});




	//Pretty Photo
	$("a[rel^='prettyPhoto']").prettyPhoto({
		social_tools: false
	});
});

	