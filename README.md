#Node JS Loader (client-side)

This is a web-service which will serve your JS files for you. It does a few spiffy things:

 * Concatenate a set of JS files on-the-fly so you only download one file
 * Automatically resolve dependencies

This allows you to accomplish the following objectives:

 * Keep JS tidy in as many separate files as you want without peformance concerns
 * Get the benefit of concatenated JS without having to constantly update the concatenated files
 * Get the benefit of dependency resolution, like you would with any other language (if a.js depends on b.js, you only need to ask for a.js)

This app is written in node.js, but is really not *for* node.js. You can use it for any web project. It is for clinet-side javascript, not server-side.

#Installation

npm install js-loader@latest

#Synopsis

Run the server

    jsloader /home/dmcquay/myproject/js

Request your files

    <script type="text/javascript" src="http://js.mysite.com/?sources=a.js,b.js,c.js"></script>


And if the first line of c.js looks like this:

    //require d.js

Then d.js will be included in the output.

You can also request minfied output

    <script type="text/javascript" src="http://js.mysite.com/?sources=a.js,b.js,c.js&minify=1"></script>

And you can have multiple source directories

    jsloader /home/dmcquay/myproject/js1 /home/dmcquay/myproject/js2

#Planned features

 * Caching
 * GZip (maybe use Connect?)
 * Conditional Get support (maybe use Connect?)
