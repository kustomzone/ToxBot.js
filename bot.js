// Required packages
var readline = require('readline');
var toxcore = require('toxcore');
var tox = new toxcore.Tox();

// Main bot code
var toxbot =
{
    events: ['connectionStatus', 'friendAction', 'friendMessage', 'friendRequest', 'groupInvite', 'readReceipt'],
    
    identity: false, // Filename for the currently loaded identity
    autosave: false,
    
    connect: function()
    {
        // Initialize stuff
        console.log("Connecting to Tox...");
        console.log("Tox ID: " + tox.getAddressHexSync());

        // Start syncronization with the tox network
        tox.start();
    },

    _default: function()
    {
        console.log(arguments);
    },

    bind: function()
    {
        for(var i = 0, l = toxbot.events.length; i < l; i++)
        {
            var event = '_'+toxbot.events[i];

            if(typeof toxbot[event] != "function")
                event = toxbot._default;
            
            tox.addListener(toxbot.events[i], toxbot[event]);
        }
    },

    unbind: function()
    {
        for(var i = 0, l = toxbot.events.length; i < l; i++)
        {
            var event = '_'+toxbot.events[i];

            if(typeof toxbot[event] != "function")
                event = toxbot._default;
            
            tox.removeListener(toxbot.events[i], toxbot[event]);
        }
    },

    disconnect: function()
    {
        tox.stop();
    }
}

// Command line interface
var interface =
{
    commands: ['connect', 'disconnect', 'load', 'save', 'autosave', 'quit'],
    
    load: function()
    {
        console.log("Welcome to ToxBot.js! Avalable commands are:");
        console.log(interface.commands.join(', '));

        // Initialize the command line interface
        interface.readline = readline.createInterface(process.stdin, process.stdout);
        interface.readline.prompt();

        // Start requesting input
        interface.readline.on('line', function(line)
        {
            interface.handle(line);
        });
    },

    // Process user input
    handle: function(line)
    {
        line = line.trim().split(/\s+/);
        var command = line.shift();

        // If this command exists
        if(interface.commands.indexOf(command) > -1)
        {
            interface['_'+command](line);
        }
        else
        {
            console.log("Invalid command! Available commands are:");
            console.log(interface.commands.join(', '));
            interface.readline.prompt();
        }
    },

    _connect: function(options)
    {
        toxbot.connect();
        interface.readline.prompt();
    },

    _disconnect: function(options)
    {
        toxbot.disconnect();
        interface.readline.prompt();
    },

    // Load tox identity from a file
    _load: function(options)
    {
        var filename = options.join(' ');

        // Make sure tox isn't currently connected
        if(tox.isStarted())
        {
            console.log("Warning: Tox is already started, all unsaved data will be lost.");
            toxbot.disconnect();
        }

        toxbot.identity = filename;

        tox.loadFromFile(filename);
        interface.readline.prompt();
    },

    // Save tox identity to a file
    _save: function(options)
    {
        var filename = options.join(' ');

        // Save existing identity file if no filename was passed
        if(!filename && !toxbot.identity)
        {
            console.log("Warning: You must specify a filename.");
        }
        else if(toxbot.identity)
        {
            filename = toxbot.identity;
        }

        toxbot.identity = filename;
        
        tox.saveToFile(filename);
        interface.readline.prompt();
    },

    // Update toxbot's identity saving behavior
    _autosave: function(options)
    {
        var action = (options.shift() || '').toLowerCase();

        if(action == 'on' || action == 'true' || action === 1)
        {
            toxbot.autosave = true;
        }
        else if(action == 'off' || action == 'false' || action === 0)
        {
            toxbot.autosave = false;
        }
        else
        {
            // Toggle current autosave state
            toxbot.autosave = !toxbot.autosave;
        }

        console.log("Tox identity auto-saving is currently:", toxbot.autosave);

        if(!toxbot.identity)
        {
            console.log("Warning: No tox identity file has been loaded, autosaving won't work until one is loaded.");
        }

        interface.readline.prompt();
    },

    _quit: function(options)
    {
        console.log("Bye!");

        toxbot.disconnect();
        interface.unload();
    },

    unload: function()
    {
        // Stop requesting input
        interface.readline.close();
    }
}

interface.load();
