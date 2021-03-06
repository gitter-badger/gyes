/**
 * @module Interpretation
 */

/**
 * Module dependencies
 */

var util = require( 'util' );
var debug = require('debug')('gyes:interpretation');
var Set = require('set-collection');
var Clock = require( './clocks' );
var messaging = require( './messaging' );

/**
 * Module exports
 */

module.exports = Interpretation;

/**
 * Module constructor
 * @constructor
 */
function Interpretation( eventsList ){
  var bag = new Set();

  if ( 'undefined' === typeof eventsList ){
    throw new Error( 'Missing argument: eventsList' );
  }

  if ( 'string' === typeof eventsList ){
    eventsList = [ eventsList ];
  }

  if ( !util.isArray(eventsList) ){
    throw new Error( 'Wrong argument. Expected an array or a string with an unique event.' );
  }

  for ( var i=0; i < eventsList.length; i++ ){
    bag.add( eventsList[i] );
  }

  this.events = eventsList;
  this.name = this.getName( eventsList );
  this.set = bag;
  this.count = bag.count;
  this.lastEvent = null;
  this.synths = [];
  this.canSynth = false;

  this.clock = new Clock();
  this.clock.on( 'clock::stop', this.reset.bind(this) );
}

/**
 * Module implementation
 */

/**
 * getName Access to interpretation identifier.
 * @param  {Array} eventsList A list of events, used to generate interpretations identifier.
 * @return {String}            A simple interpretation identifier.
 * @public
 */
Interpretation.prototype.getName = function getName( events ){
  var name = '';

  events = events || this.events;

  for (var i = 0; i < events.length; i++) {
    name += events[i];
  }

  return name;
};

/**
 * touch Updates interpretation instance state.
 * @param  {String} eventName A captured event name.
 *
 * @private
 */
Interpretation.prototype.touch = function touch( eventName ){
  if ( 'undefined' === typeof eventName ){
    throw new Error( 'An event is required' );
  }
  debug( 'interpretation::touch ', eventName );

  if ( (eventName == this.lastEvent) || (!this.set.has(eventName)) ) return;

  this.lastEvent = eventName;
  this.count = this.count - 1;

  if ( this.count <= 0 ){
    // distributing a new interpretation.
    messaging.emit( 'interpretation::trigger', this );
    this.clock.stop();
  }else{
    this.clock.update();
  }
};

/**
 * reset Restart an internal interpretation counter/state.
 * @private
 */
Interpretation.prototype.reset = function reset(){
  this.count = this.set.count;
  this.lastEvent = null;
};

/**
 * getEventsList Getter for the interpretations events list.
 * @return {Array} Interpretations events list.
 * @public
 */
Interpretation.prototype.getEventsList = function getEventsList(){
  return this.events;
};

/**
 * canSynthetize Attachs a synthetizer to an interpretation.
 * @param {String} modalityID A string that identifies a unique modality type.
 * @param {String} modalityDriverID A string indicating a reference to a modality driver.
 * @param {Object} params An optional object containing parameters to be passed to the modality synth.
 *
 * @public
 */
Interpretation.prototype.canSynthetize = function canSynthetize( modalityID, modalityDriverID, params ){
  if ( ('undefined' === typeof modalityID) || ('undefined' === typeof modalityDriverID) ){
    throw new Error( 'Missing params. A modality id and a modality driver id are both required.' );
  }

  this.canSynth = true;
  params = params || {};
  this.synths.push({
    'modality': modalityID,
    'modalityDriver': modalityDriverID,
    'params': params
  });

};