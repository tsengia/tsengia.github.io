var currentNetwork; //Global variable for the current neural network in use

//Type enums for neurons
var OUTPUT = 0;
var BIAS = 1;
var INPUT = 2;
var NEURON = 3;

var RANDOM_WEIGHT_MIN = -0.5;
var RANDOM_WEIGHT_MAX = 0.5;

function randomFloat(min, max) {
 return Math.random() * (max-min) + min; //Generates a random float. Can be negative or positive
}

function randomWeight() {
	return randomFloat(RANDOM_WEIGHT_MIN, RANDOM_WEIGHT_MAX);
}

function ActivationFunction(fire, derive) { //See comments listed under the linearActivation function to see how to use this class
  this.activate = fire;
  this.derivative = derive;
} //ActivationFunction Objects should be added to the Network.activationFunctions array

var constantActivation = new ActivationFunction( //This is the activation function used by bias neurons
  function(neuron) {
    neuron.value = 1; //This activation function always outputs 1
    return 1;
  },
  function(x) { //Constant rule for differentation states: f(x) = a, where a is a constant, then f'(x) = 0
    return 0*x; //Why are we multiplying if we know it will always be 0? Oh well
  }
);

var linearActivation = new ActivationFunction( //Example activation function
   function(neuron) { //The activation function is given the neuron, may store, read, or modify the neuron in any way it needs to decide/calculate the output of the neuron
    neuron.value = neuron.input;
    return neuron.value;
  },
   function(x) { //Return the derivative of the function with respect to x
    return 1;
  }
);

var logisticActivation = new ActivationFunction( //Example activation function
   function(neuron) { //The activation function is given the neuron, may store, read, or modify the neuron in any way it needs to decide/calculate the output of the neuron
    neuron.value = 1/(1+Math.pow(Math.E,-1*(neuron.input)));
    return neuron.value;
  },
   function(x) { //Return the derivative of the function with respect to x
    return (1/(1+Math.pow(Math.E,-1*(x)))) * (1-(1/(1+Math.pow(Math.E,-1*(x)))));
  }
);

function calculateError(output, target) { //Returns the error of the network from the output array and target array
  if(output.length != target.length) { //Error out if the output and target arrays are not the same lengths
    Studio.error("Target and output array lengths are not the same!");
    return NaN;
  }
  var x = 0;
  for(var i = 0; i < output.length; i++) {
    x += output[i] - target[i];
  }
  return Math.pow(x,2) * 0.5; // y = 0.5 * sum (target - output)^2
}

var Network = function() {
  this.neurons = []; //An array of Neuron objects
  this.inputNeurons = []; //An array containing the indexes of the Input neurons (the indexes of the Input Neurons in the neurons[] array)
  this.outputNeurons = []; //An array containing the indexes of the Output neurons
  this.output = []; // An array containing the output
  this.connections = []; //An array containing all of the Connection objects
  this.name = "Neural Network"; // The name of the Network.
  this.updateList = []; //An array of the neurons that need to updated the next tick, allows for networks to not be bounded into layers
  this.step = 0; //There is one step per tick
  this.tick = 0; //There are multiple ticks in a step
  this.activationFunctions = []; //A list of ActivationFunction objects
  this.learningRate = 0.5; //The learning rate for the network should be between 0 (exclusive) and 1 (inclusive)
  
  this.addNeuron = function(n) { //For normal (hidden layer) neurons
    this.neurons.push(n); //Add the neuron to the list of neurons
    var i = this.neurons.length-1; //Get the ID of the new neuron
    this.neurons[i].id = i; //Assigns the ID of the neuron to its index in the array of neurons
    if(this.neurons[i].type != BIAS && this.neurons[i].type != INPUT) { //Do not add a bias to a neuron that is an input neuron or a bias neuron, only hidden and output neurons have bias connections
    	registerConnection(new Connection(0, i, randomWeight())); //Registers the connection from the bias neuron
    }
  	return i;//Return the ID of neuron
  };
  
  this.addInputNeuron = function(n) { //For input (input layer) neurons
    this.neurons.push(n);
    var i = this.neurons.length-1;
    this.neurons[i].id = i; //Assigns the ID of the neuron to its index in the array of neurons
  	 this.inputNeurons.push(i);
    return i; 
  };
  
  this.addOutputNeuron = function(n) { //For output (output layer) neurons
    this.neurons.push(n);
    var i = this.neurons.length-1; //Get the ID of the new neuron
    this.neurons[i].id = i; //Assigns the ID of the neuron to its index in the array of neurons
  	 this.neurons[i].outputIndex = this.outputNeurons.length; //Assign the OutputNeuron the index of the output array that it should return its value to
    this.outputNeurons.push(i);
    registerConnection(new Connection(0, i, randomWeight())); //Registers the connection from the bias neuron
    return i;
  };
  
  this.outputDone = function() { //Returns true if the output array is not empty (ie, all of the output neurons have fired yet)
    for(var i = 0; i < this.output.length; i++){
      if(this.output[i] == undefined) {
       return false; // If just one cell/value is empty, return false
      }
    }
    return true; //All cells/indexes are filled, return true
  };
  
  this.forEachNeuron = function(method) { //This is a utility function that iterates through all of the neurons and calls the methods. The connection ID is passed as a parameter
    for(var neuronID = 1; neuronID < this.neurons.length; neuronID++) { //Start with index of 1 to skip over the bias neuron
    	method(neuronID); 
    }
  };
  
  this.forEachHiddenNeuron = function(method) { //This is a utility function that iterates through all of the hidden neurons and calls the methods. The connection ID is passed as a parameter
    for(var neuronID = 1; neuronID < this.neurons.length; neuronID++) { //Start with index of 1 to skip over the bias neuron
		if(this.inputNeurons.indexOf(neuronID) * this.outputNeurons.indexOf(neuronID) == 1) { 	// If the neuron ID is not listed as an input or output neuron, it must be a hidden neuron
    		method(neuronID); 
    	}
    }
  };
  
  this.forEachInputNeuron = function(method) { //This is a utility function that iterates through all of the input neurons and calls the methods. The connection ID is passed as a parameter
    for(var i = 0; i < this.inputNeurons.length; i++) {
		method(this.inputNeurons[i]);
    }
  };
  
  this.forEachOutputNeuron = function(method) { //Same as all of the other forEach functions but instead for output neurons.
 	 for(var i = 0; i < this.outputNeurons.length; i++) {
		method(this.outputNeurons[i]);
    }
  };
  
  this.forEachConnection = function(method) { //This is a utility function that iterates through all of the connection and calls the methods. The neuron ID is passed as a parameter
    for(var connectionID = 0; connectionID < this.connections.length; connectionID++) {
    	method(connectionID); 
    }
  };
  
  this.dumpWeights = function() { //Returns a list all of the weights. Delimited by commas
    var s = this.connections[0].weight;
    for(var c = 1; c < this.connections.length; c++) {
    	s += ", " + this.connections[c].weight;
    }
    return s;
  };
  
  this.dumpBiases = function () { //Returns a list all of the biases. Delimited by commas
  	 var s = this.connections[this.neurons[0].outConnections[0]].weight;
  	 for(var c = 1; c < this.neurons[0].outConnections.length; c++) {
    	s += ", " + this.connections[this.neurons[0].outConnections[c]].weight;
    }
    return s;
  };
  
  this.clearNeuronValues = function() { //Clears the output and input values for each neuron.
    for(var n = 1; n < this.neurons.length; n++) {
     this.neurons[n].value = 0; 
     this.neurons[n].input = 0; 
    }
  };

  this.noteUpdate = function(id) { // Adds a neurons to the needs-update list if it is not already on it
    if(this.updateList.indexOf(id) == -1) { //If the neuron is not already in the list, add it to it
     this.updateList.push(id);
    }
  };

  this.run = function(inputArray) {
    if(inputArray.length != this.inputNeurons.length) { //Throw an error if the input supplied cannot be applied to the network
      Studio.error("Input dimensions mismatch! Input neurons and input length are not equal!");
      return NaN;
    }
    
    this.output = new Array(this.outputNeurons.length); //Create a new output array to hold the output values
    this.clearNeuronValues();
    //tick 0 is the input layer
    this.tick = 0;
    this.updateList = [];
    for(var i = 0; i < inputArray.length; i++) { //Iterate through the input array and assign its values to the input neurons in the net
      this.neurons[this.inputNeurons[i]].value = inputArray[i];
      for(var o = 0; o < this.neurons[this.inputNeurons[i]].outConnections.length; o++) { //Mark all of the neurons linked to the input neurons to be updated
       this.noteUpdate(this.connections[this.neurons[this.inputNeurons[i]].outConnections[o]].end);
      }
    }
     
    while(this.updateList.length != 0 && !this.outputDone()) { //Loop until all output neurons are reached, or the output neurons have all fired (for RNNs)
      this.tick++;
      var currentList = this.updateList;
      this.updateList = []; //Clear the update list as we will be adding new items to it
     
      for(var i = 0; i < currentList.length; i++) {
          this.neurons[currentList[i]].evaluate(); //Evaluate each neuron that needs evaluated
    	  for(var o = 0; o < this.neurons[currentList[i]].outConnections.length; o++) { //Mark all of the neurons linked to the current neuron to be updated
    	    this.noteUpdate(this.connections[this.neurons[currentList[i]].outConnections[o]].end);
    	  }
      }
    }
    
    this.step++;
  };
  //This training function is stochastic gradient descent; updates after each case
  this.train = function(inputArray, targetArray) { // Trains the neural network
  	 this.run(inputArray);
    this.tick = 0;
    this.updateList = [];
    for(var i = 0; i < this.outputNeurons.length; i++) {
      this.neurons[this.outputNeurons[i]].delta = (this.output[i] - targetArray[i]) * this.activationFunctions[this.neurons[this.outputNeurons[i]].activation].derivative(this.neurons[this.outputNeurons[i]].value);
     // this.neurons[this.outputNeurons[i]].delta = (this.output[i] - targetArray[i])*this.output[i]*(1-this.output[i]);
      for(var o = 0; o < this.neurons[this.outputNeurons[i]].inputConnections.length; o++) { 
        var s = this.connections[this.neurons[this.outputNeurons[i]].inputConnections[o]].start;
        this.noteUpdate(s);
        //TODO: Find out how to find the delta of the bias neuron
        /*if(s != 0) { //Make sure the neuron is not a bias neuron
       		this.noteUpdate(s);
        }*/
      }
    }
    
    var done = false;
    while(this.updateList.length != 0 && !done) { //Calculate the delta for each neuron in the list
      var currentList = this.updateList;
      this.updateList = []; //Clear the update list as we will be adding new items to it
      for(var i = 0; i < currentList.length; i++) {
    	  	 var v = 0;
          for(var o = 0; o < this.neurons[currentList[i]].outConnections.length; o++) {
            v += this.connections[this.neurons[currentList[i]].outConnections[o]].weight * this.neurons[this.connections[this.neurons[currentList[i]].outConnections[o]].end].delta;
          }
          this.neurons[currentList[i]].delta = v * this.activationFunctions[this.neurons[currentList[i]].activation].derivative(this.neurons[currentList[i]].input);
            
          for(var o = 0; o < this.neurons[currentList[i]].inputConnections.length; o++) { //Mark all of the neurons giving input to the current neuron as needing calculated
            this.noteUpdate(this.connections[this.neurons[currentList[i]].inputConnections[o]].start);
    	  }
      }
    }
    var changes = new Array();
    for(var c = 0; c < this.connections.length; c++) {
      var change = (-1*this.learningRate)*this.neurons[this.connections[c].start].value*this.neurons[this.connections[c].end].delta;
      this.connections[c].weight += change;
      changes.push(change);
    }
    this.clearNeuronValues();
    console.log("training done");
    return changes;
  };
  
  this.clearNeuronValues.bind(this);
  this.addNeuron.bind(this);
  this.addInputNeuron.bind(this);
  this.addOutputNeuron.bind(this);
  this.run.bind(this);
  this.train.bind(this);
  this.noteUpdate.bind(this);
  this.outputDone.bind(this);
  
  this.activationFunctions.push(constantActivation);
  this.CONSTANT = 0;
  
  this.activationFunctions.push(linearActivation);
  this.LINEAR = this.activationFunctions.length - 1;
  
  this.activationFunctions.push(logisticActivation);
  this.LOGISTIC = this.activationFunctions.length - 1;
  
  this.addNeuron(new BiasNeuron()); // The bias neuron is always in index 0 
};

function registerConnection(c) {
  var id = currentNetwork.connections.length;
  currentNetwork.connections.push(c);
  currentNetwork.neurons[c.start].outConnections.push(id);
  currentNetwork.neurons[c.end].inputConnections.push(id);
  return id; 
}

var Connection = function(from, to, w) { //Holds the weight of a connection from one neuron to another.
  this.start = from; //The neuron that sends an electrical spike through this connection.
  this.end = to; //The neuron that receives an electrical spike through this connection.
  this.weight = w;
};

var Neuron = function() { 
	 this.id = undefined;
  	 this.value = 0;
    this.outConnections = []; // A list of all of the connections and their IDs - Outbound
    this.inputConnections = []; // A list of all of the connections and their IDs - Inbound
    this.input = 0;
  	 this.type = NEURON;
    this.delta = 0;
  
    this.addConnection = function(to, weight) { //Add a connection going to another neuron
      registerConnection(new Connection(this.id, to, weight));
    };
  
    this.evaluate = function() { //Sets the neuron to its value after firing
      for(var i = 0; i < this.inputConnections.length; i++) {
        this.input += currentNetwork.neurons[currentNetwork.connections[this.inputConnections[i]].start].value * currentNetwork.connections[this.inputConnections[i]].weight;
      }
      currentNetwork.activationFunctions[this.activation].activate(this); //Runs the activation function of the neuron. The activation function will set the neurons value, so no need to assign here
		return this.value;   
    };
  
    this.activation = currentNetwork.LINEAR;
  
    this.addConnection.bind(this);
    this.evaluate.bind(this);
};

var BiasNeuron = function() {
	this.id = undefined;
  	this.value = 1;
  	this.outConnections = []; // A list of all of the connections and their IDs - Outbound
  	this.inputConnections = [];
  	this.type = BIAS;
    this.delta = 0;
  	this.activation = 0; //0 is a constant activation
  
    this.addConnection = function(to, weight) { //Add a connection going to another neuron
      registerConnection(new Connection(this.id, to, weight));
    };
  
    this.evaluate = function() {
      this.value = 1;
      return 1;
    };
  
    this.addConnection.bind(this);
    this.evaluate.bind(this);
};

var InputNeuron = function() {
  	this.id = undefined;
  	this.value = 0;
  	this.outConnections = []; // A list of all of the connections and their IDs - Outbound
  	this.inputConnections = []; //Should never be added to, but is needed for training
  	this.delta = 0;
  	this.type = INPUT;
  
    this.addConnection = function(to, weight) { //Add a connection going to another neuron
      registerConnection(new Connection(this.id, to, weight));
    };
  
    this.evaluate = function() {
      return this.value;
    };
  
    this.activation = currentNetwork.LINEAR;
  
    this.addConnection.bind(this);
    this.evaluate.bind(this);
};

var OutputNeuron = function() { 
	 this.id = undefined;
    this.outputIndex = undefined;
  	 this.value = 0;	
    this.outConnections = []; // A list of all of the connections and their IDs - Outbound
    this.inputConnections = []; // A list of all of the connections and their IDs - Inbound
    this.input = 0;//
  	 this.type = OUTPUT;
    this.delta = 0;
  
    this.addConnection = function(to, weight) { //Add a connection going to another neuron
      registerConnection(new Connection(this.id, to, weight));
    };
  
    this.evaluate = function() { //Sets the neuron to its value after firing
      for(var i = 0; i < this.inputConnections.length; i++) {
        this.input += currentNetwork.neurons[currentNetwork.connections[this.inputConnections[i]].start].value * currentNetwork.connections[this.inputConnections[i]].weight;
      }
      currentNetwork.activationFunctions[this.activation].activate(this); //Run the activation function this neuron has
      currentNetwork.output[this.outputIndex] = this.value;
      return this.value;
    };
  
    this.activation = currentNetwork.LINEAR;
  
    this.addConnection.bind(this);
    this.evaluate.bind(this);
};

var TrainingSet = function (setID, input, output) {
	this.input = input;
	this.id = setID;
	this.output = output;
};

function parseTrainingData(string) {
	var x = [];
	var s = string.split("");
	for(var i =0; i < s.length; i++) {
		x.push(parseInt(s[i]));	
	}
	return x;
}

function createNetworkFromLayerArray(layers) { //Creates a network from the array layers. Each entry in the array holds the number of neurons in the layer
	var layerCount = layers.length;
	if(layerCount < 2) {
		Studio.error("The network structure passed into createNetworkFromLayerArray has only 1 layer! Create a perceptron instead! Neural network not created!");	
		return NaN;
	}
	var outputCount = layers[layerCount - 1];
	var inputCount = layers[0];
	
	
	var net = new Network();
  	currentNetwork = net;
	net.name = "Layered Network";
	for(var i = 0; i < inputCount; i++) {
		net.addInputNeuron(new InputNeuron());
	}
	var lastLayerStart = 1; // 0 is the bias neuron, so 1 is the index of the first input neuron
	var lastLayerEnd = inputCount-1; 
	for (var l = 1; l <= layerCount - 2; l++) { //Go through each hidden layer
		for (var i = 0; i < layers[l]; i++) { //Go through each neuron in the layer
			var n = net.addNeuron(new Neuron()); //Add the neuron and keep it's ID
			for (var c = lastLayerStart; c < lastLayerEnd; c++) { //Go through each neuron in the last layer and connect it to the new neuron
				net.neurons[c].addConnection(n, randomWeight());
         }
		}
		lastLayerStart += layers[l]; //Increment the start and end indexes of the last layer.
		lastLayerEnd += layers[l];
	}
	
	for(var o = 0; o < outputCount; o++) { //Add in the output layer
		var n = net.addOutputNeuron(new OutputNeuron());
		for (var c = lastLayerStart; c < lastLayerEnd; c++) { //Connect each output neuron to the previous layer.
			net.neurons[c].addConnection(n, randomWeight());
		}
	}
	return net;
}

var net = createNetworkFromLayerArray([20,15,10]);
net.forEachHiddenNeuron(function (id) { currentNetwork.neurons[id].activation = currentNetwork.LOGISTIC; }); //Sets each neuron's activation function to logistic
//console.log(net.train([0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0], [0,1,0,0,0,0,0,0,0,0]));
//net.run([0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0]);
var sets = [];
sets.push(new TrainingSet(0, parseTrainingData("01000010000100001000"), parseTrainingData("1000000000")));
sets.push(new TrainingSet(1, parseTrainingData("11110001111110001111"), parseTrainingData("0100000000")));
sets.push(new TrainingSet(2, parseTrainingData("11110001111100011111"), parseTrainingData("0010000000")));
sets.push(new TrainingSet(3, parseTrainingData("10011001111100010001"), parseTrainingData("0001000000")));
sets.push(new TrainingSet(4, parseTrainingData("11111000111100011111"), parseTrainingData("0000100000")));
sets.push(new TrainingSet(5, parseTrainingData("11110001111110011111"), parseTrainingData("0000010000")));
sets.push(new TrainingSet(6, parseTrainingData("11110001000100010001"), parseTrainingData("0000001000")));
sets.push(new TrainingSet(7, parseTrainingData("11111001111110011111"), parseTrainingData("0000000100")));
sets.push(new TrainingSet(8, parseTrainingData("11111001111100011111"), parseTrainingData("0000000010")));
sets.push(new TrainingSet(9, parseTrainingData("11111001100110011111"), parseTrainingData("0000000001")));
sets.push(new TrainingSet(10, parseTrainingData("00010001000100010001"), parseTrainingData("1000000000")));

function getNetworkAnswer() {
	var currentIndex = 0;
	for(var i = 1; i < currentNetwork.output.length; i++) {
		if(currentNetwork.output[currentIndex] < currentNetwork.output[i]) {
			currentIndex = i;		
		}	
	}
	return currentIndex + 1;
}

function trainWithSet(set) {
	console.log("Training using set ID: " + set.id);
	currentNetwork.train(set.input, set.output);
}
//
// End framework, test training for the AND function
//
/*
currentNetwork = new Network();


var in1 = currentNetwork.addInputNeuron(new InputNeuron());
var n1 = currentNetwork.addNeuron(new Neuron());
currentNetwork.neurons[n1].activation = currentNetwork.LOGISTIC;
var o1 = currentNetwork.addOutputNeuron(new OutputNeuron());
currentNetwork.neurons[in1].addConnection(n1, 1);
currentNetwork.neurons[n1].addConnection(o1, 1);
currentNetwork.run([1]);
Studio.log(currentNetwork.output);
*/