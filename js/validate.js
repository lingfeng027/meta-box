( function ( $, rwmb, i18n ) {
	'use strict';

	var Validation = {
		// Form element.
		$form: null,

		// Validation settings.
		settings: {},

		init: function() {
			Validation.addAsterisks();
			Validation.getForm();
			Validation.getSettings();

			if ( rwmb.isGutenberg ) {
				Validation.runOnGutenberg();
				return;

			Validation.$form.on( 'submit', function() {
				// Update underlying textarea before submit validation.
				if ( typeof tinyMCE !== 'undefined' ) {
					tinyMCE.triggerSave();
				}
			} ).validate( Validation.settings );
		},

		addAsterisks: function () {
			$( '.rwmb-validation-rules' ).each( function () {
				var data = $( this ).data( 'rules' );

				$.each( data.rules, function ( k, v ) {
					if ( ! v['required'] ) {
						return;
					}
					var $el = $( '[name="' + k + '"]' );
					if ( ! $el.length ) {
						return;
					}
					$el.closest( '.rwmb-input' ).siblings( '.rwmb-label' ).find( 'label' ).append( '<span class="rwmb-required">*</span>' );
				} );
			} );
		},

		getForm: function () {
			// In Gutenberg.
			if ( rwmb.isGutenberg ) {
				Validation.$form = $( '#poststuff' );
				return;
			}

			// Edit post form.
			Validation.$form = $( '#post, .rwmb-form' );

			// Edit user form.
			if ( ! Validation.$form.length ) {
				Validation.$form = $( '#your-profile' );
			}

			// Edit term form.
			if ( ! Validation.$form.length ) {
				Validation.$form = $( '#edittag' );
			}
		},

		runOnGutenberg: function () {
			var editor = wp.data.dispatch( 'core/editor' );

			// Reference original method.
			var savePost = editor.savePost;

			// Change validation settings on Gutenberg: invalid and submit handlers.
			Validation.settings.invalidHandler = function() {
				wp.data.dispatch( 'core/notices' ).createErrorNotice( i18n.summaryMessage, {
					id: 'meta-box-validation',
					isDismissible: true
				} );
				editor.lockPostSaving( 'meta_box' );

				setTimeout( function() {
					Validation.$form.trigger( 'after_validate' );
				}, 200 );
			};
			Validation.settings.submitHandler = function() {
				savePost();
			};

			// Override core method.
			editor.savePost = function() {
				Validation.$form.removeAttr( 'novalidate' ).validate( Validation.settings );
			}
		},

		getSettings: function () {
			Validation.settings = {
				ignore: ':not([class|="rwmb"]:visible)',
				errorPlacement: function( error, element ) {
					error.appendTo( element.closest( '.rwmb-input' ) );
				},
				errorClass: 'rwmb-error',
				errorElement: 'p',
				invalidHandler: function () {
					// Re-enable the submit ( publish/update ) button and hide the ajax indicator
					$( '#publish' ).removeClass( 'button-primary-disabled' );
					$( '#ajax-loading' ).attr( 'style', '' );
					Validation.$form.siblings( '#message' ).remove();
					Validation.$form.before( '<div id="message" class="notice notice-error is-dismissible"><p>' + i18n.summaryMessage + '</p></div>' );

					// Custom event for showing error fields inside tabs/hidden divs. Use setTimeout() to run after error class is added to inputs.
					setTimeout( function() {
						Validation.$form.trigger( 'after_validate' );
					}, 200 );
				}
			};

			// Gather all validation rules.
			$( '.rwmb-validation-rules' ).each( function () {
				$.extend( true, Validation.settings, $( this ).data( 'rules' ) );
			} );
		},
	};

	// Run on document ready.
	$( Validation.init );
} )( jQuery, rwmb, rwmbValidate );
