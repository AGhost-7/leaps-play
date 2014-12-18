(function($, routes){

var $inputContainer = $('#input-container')

var inputScene = {
	empty: function(){
		$inputContainer.hide('blind', {}, 500, function(){
			$inputContainer.html('')
		})
	},
	swap: function(htmlGenerator, postShow){
		// I want this to handle cases where there is no
		// data in there as well
		if($inputContainer.css('display') === 'none'){
			htmlGenerator()
			$inputContainer.show('blind', {}, 500, postShow)
		} else{		
			$inputContainer.hide('blind', {}, 500, function(){
				$inputContainer.html('')
				htmlGenerator()
				$inputContainer.show('blind', {}, 500, postShow)
			})
		}
	}
}

var notation = [
	'C',  'Db', 'D', 
	'Eb', 'E',  'F', 
	'Gb', 'G',  'Ab', 
	'A',  'Bb', 'B'
]

var $canvas = $('#tuning-view')

var fingerboard = new Fingerboard($canvas, {
	strings: 1,
	frets: 13,
	interval:{
		tuning: [0]
	},
	scale:{
		// Just want to have a view of C Major
		values: [1, 3, 5, 6, 8, 10, 12],
		root: 1,
		select: true
	},
	display:{
		// use the notation preset
		selector: Fingerboard.Selectors.notation()
	}
})

/**
 * Templates
 */
 
// Lets make it better for use with jquery...
Handlebars.$load = function(selector){
	var html = $(selector).html(),
		template = Handlebars.compile(html)
	
	return function(args){
		return $(template(args))
	}
}

var tuningValuesTemplate = (function(){
	var $init = Handlebars.$load('#tuning-values-template')
	return function($target, i){
		var $input = $init({
				notes: notation,
				indexes: [0, 1, 2, 3, 4, 5, 6, 7, 8],
				i: i
			})
		
		$target.append($input)
		
		$input.find('.tuning-note-input a').click(updateNote)
		$input.find('.tuning-index-input a').click(updateIndex)
	}
})()

var tuningInputTemplate = (function(){
	var $init = Handlebars.$load('#tuning-input-template')
	
	return function(args){
		
		var 
			i = args.strings
			tuning = [],
			$input = $init({})
		
		args.$tieTo.append($input)
		
		var $target = $('#tuning-dropdown-loc')
			
		while(i > 0){
			tuningValuesTemplate($target, i--)
			tuning.push(0)
		}
		
		// move the canvas to its appropriate location so it 
		// can be seen
		$('#tuning-values-loc').append($canvas)
		
		fingerboard.set({
			strings: args.strings,
			interval:{
				tuning: tuning
			}
		})
		
		// Now the events for this scene...
		$input.find('#input-tuning-ok').click(args.onOk)
		$input.find('#input-tuning-cancel').click(args.onCancel)
	}
})()

var instrumentInputTemplate = (function(){
	var $init = Handlebars.$load('#instrument-input-template')
	
	return function(args){
		var $target = args.$tieTo,
			$input = $init(args)
			
		
		//$target.html('')
		$target.append($input)
		
		var $okBtn = $input.find('#instrument-ok'),
			$cancelBtn = $input.find('#instrument-cancel')
		
		if(args.isUpdate)
			$okBtn.click(updateInstrument)
		else
			$okBtn.click(insertInstrument)
			
		$cancelBtn.click(inputScene.empty)
		
		return $input
	}
})()

/**
 * Initialization
 */

$('.btn-up-instrument').click(modifyInstrument)
$('#btn-add-instrument').click(addInstrument)
$('.btn-rem-instrument').click(removeInstrument)
$('.btn-show-tunings').click(showTunings)

/**
 * DOM bindings for tables
 */
 
var instruments = {
	$table: $('#instruments-table'),
	$tbody: $('#instruments-table tbody'),
	$init: Handlebars.$load('#instrument-row-template'),
	$row: function(){
		var id = typeof arguments[0] === 'object' ? 
			arguments[0].id : arguments[0] 
		
		return this.$tbody.find('tr[data-id="' + id + '"]')
	},
	append: function(instrument){
		var $row = this.$init(instrument)
		console.log(instrument)
		console.log('attempting append\n',$row.html())
		
		this.$tbody.append($row)
		
		$row.find('.btn-up-instrument').click(modifyInstrument)
		$row.find('.btn-rem-instrument').click(removeInstrument)
		$row.find('.btn-show-tunings').click(showTunings)
	},
	update: function(instrument){
		var $tr = this.$row(instrument)
		
		$tr.data('default-tuning', instrument.defaultTuning)
		
		$tr.find('td:nth-child(2)').text(instrument.name)
		$tr.find('td:nth-child(3)').text(instrument.strings)
	},
	get: function(id){
		var $tr = this.$row(id)
		return {
			id: $tr.data('id'),
			name: $tr.find('td:nth-child(2)').text(),
			strings: Number($tr.find('td:nth-child(3)').text()),
			defaultTuning: $tr.data('default-tuning')
		}
	},
	remove: function(){
		this.$row(arguments[0]).remove()
	},
	hide: function(callback){
		this.$table.hide('blind', {}, 500, callback)
	},
	show: function(callback){
		this.$table.show('blind', {}, 500, callback)
	}
}

var tunings = {
	$table: $('#tunings-table'),
	$tbody: $('#tunings-table > tbody'),
	$init: Handlebars.$load('#tuning-row-template'),
	$row: function(){
		var id = typeof arguments[0] === 'object' ? 
			arguments[0].id : arguments[0] 
		
		return this.$tbody.find('tr[data-id="' + id + '"]')
	},
	display: function(instrumentId){
		var $init = this.$init,
			$tbody = this.$tbody
			
		$tbody.html('')
			
		userTunings[instrumentId].forEach(function(tuning){
			console.log(tuning)
			var $tr = $init(tuning)
			$tbody.append($tr)
		})
		
		// attach event handlers
		this.$tbody.find('.btn-up-tuning').click(updateTuning)
		this.$tbody.find('.btn-rem-tuning').click(removeTuning)
		
		this.$table.data('id', instrumentId)
		
		//this.$table.data('default-tuning', )
		
		this.$table.show('blind')
	},
	hide: function(callback){
		this.$table.hide('blind', {}, 500, callback)
	},
	show: function(callback){
		this.$table.show('blind', {}, 500, callback)
	},
	append: function(tuning){
		var $tr = this.$init(tuning)
		this.$tbody.append($tr)
		
		$tr.find('.btn-up-tuning').click(updateTuning)
		$tr.find('.btn-rem-tuning').click(removeTuning)
	},
	update: function(tuning){
		var $tr = this.$row(tuning)
		
		
	}
}

/**
 * Event Handlers
 */

function onServerError(xhr){
	var response = JSON.parse(xhr.messageBody)
	alert(response.errorMessage)
}

/**
 * Event Handlers: Tunings
 */

function updateIndex(e){
	var $t = $(this),
		$group = $t.parents('.tuning-dropdown-group'),
		newIndex = Number($t.text())
		
	$group.data('index', newIndex)
	
	// now we update the tuning with the changes
	inputUpdateTuning($group)
	
	e.preventDefault()
}

function updateNote(e){
	var $t = $(this),
		$group = $t.parents('.tuning-dropdown-group'),
		newNote = notation.indexOf($t.text())
	
	$group.data('note', newNote)
	
	// now we update the tuning with the changes
	inputUpdateTuning($group)
	
	e.preventDefault()
}

function inputUpdateTuning($group){
	var 
		note = $group.data('note'),
		index = $group.data('index'),
		i = $group.data('i'),
		tuning = fingerboard.tuning()
	
	tuning[i] = index * 12 + note
	
	fingerboard.set({
		interval:{
			tuning: tuning
		}
	})
}

function withValidTuning(callback){
	// the tuning is easy, the fingerboard has it stored already.
	var tuning = fingerboard.tuning().join(','),
		$tuningInput = $('#input-tuning-name'),
		tuningName = $tuningInput.val(),
		$p = $tuningInput.parent()
	
	// clear out all possible error messages
	$inputContainer.find('.bad-input').remove()
	
	if(tuningName.match(CONST.tuning)){
		callback(tuningName, tuning)
	} else {
		var html = 
			'<small class="text-danger bad-input">' + 
				'&nbsp&nbsp;&nbsp;Your tuning\'s name is using illegal characters.'
			'</small>' 
		$inputContainer.find('#input-tuning-name-label').append(html)
	}
}
function showTunings(){
	var $t = $(this),
		$tr = $t.parent().parent(),
		id = $tr.data('id')
	
	instruments.hide(function(){
		tunings.display(id)
	})
	
}
function addTuning(){

}

function cancelTuning(){

}

function updateTuning(){

}

function insertTuning(){

}

function removeTuning(){

}



/**
 * Event Handlers: Instruments
 */
 
function addInstrument(){
	inputScene.swap(function(){
		instrumentInputTemplate({$tieTo: $inputContainer})
	})
}

function modifyInstrument(e){

	var id = $(this)
			.parent()
			.parent()
			.data('id')
			
	// use the instrument as base
	var args = instruments.get(id)
	
	args.$tieTo = $inputContainer
	args.isUpdate = true
	
	inputScene.swap(function(){
		instrumentInputTemplate(args)	
	})
	
}

function removeInstrument(){
	var id = $(this).parent().parent().data('id')
	routes.Instruments.remove(id).ajax({
		success: function(response){
			instruments.remove(response.id)
		},
		error: onServerError
	})
	
}

function updateInstrument(){
	withValidInstrument(function(name, strings, id, defaultTuning){
		
		routes.Instruments.update(id, name, strings, defaultTuning).ajax({
			success: function(instrument){
				instruments.update(instrument)
				inputScene.empty()
			},
			error: onServerError
		})
		
	})
}

function insertInstrument(){
	
	// when all is said and done, insert the instrument using
	// an ajax callback.
	var withAjaxUsingTuning = function(name, strings){
		return function(tuningName, tuning){
			routes.Instruments.insert(name, strings, tuningName, tuning).ajax({
				success: function(response){
				
					var inst = response.instrument,
						tuning = response.tuning
					// just add the instrument to the row
					instruments.append(inst)
					
					// add the tuning
					tunings[inst.id] = [tuning]
					
					inputScene.empty()
					
				},
				error: onServerError
			})
		}
	}
	
	withValidInstrument(function(name, strings){
		// The height will be relative to the number of strings
		// on the instrument.
		$canvas.height(strings * 55)
		
		inputScene.swap(function(){
			$inputContainer.html(
				'<div class="alert alert-info">' + 
					'Please enter the default tuning.' + 
				'</div>'
			)
			
			tuningInputTemplate({
				$tieTo: $inputContainer,
				strings: strings,
				onOk: function(e){
					// validate, then we can send the data
					withValidTuning(withAjaxUsingTuning(name, strings))
				},
				onCancel: function(e){
					inputScene.empty()
				}
			})
		
		}, function() { $canvas.trigger('resize') })
	})
}

function withValidInstrument(callback){
	var
		id = $('#input-id').val(),
		name = $('#input-name').val(),
		strings = $('#input-strings').val(),
		defaultTuning = $('#input-default-tuning').val()
	
	var error = (function(){
		var $tgt = {
			name: $('#name-header'),
			strings: $('#strings-header')
		}
	
		return function(msg, tgtName){
				
			var html =
					'<small class="text-danger bad-input">' + 
						'&nbsp&nbsp;&nbsp;' + msg + 
					'</small>' 
			
			$tgt[tgtName].append($(html))
		}
	})()
	
	strings = Math.floor(Number(strings))
	
	$inputContainer.find('.bad-input').remove()
	
	if(!name.match(CONST.instrument))
		error('Your name is using illegal characters.', 'name')
	else if(isNaN(strings))
		error('Input must be a whole number.', 'strings')
	else if(strings > 16)
		error('Too many strings for us to display on the fingerboard, friend.', 'strings')
	else if(strings < 2)
		error('You\'re going to need more strings on your instrument...', 'strings')
	else
		callback(name, strings, id, defaultTuning)
}



})(jQuery,jsRoutes.controllers)