#Node JS Loader (client-side)

This is a web-service which will serve your JS files for you. It does a few spiffy things:

 * Concatenate a set of JS files on-the-fly so you only download one file
 * Automatically resolve dependencies

This allows you to accomplish the following objectives:

 * Keep JS tidy in as many separate files as you want without peformance concerns
 * Get the benefit of concatenated JS without having to constantly update the concatenated files
 * Get the benefit of dependency resolution, like you would with any other language (if a.js depends on b.js, you only need to ask for a.js)

This app is written in node.js, but is really not *for* node.js. You can use it for any web project. It is for clinet-side javascript, not server-side.

#Synopsis

This won't actually work yet, but it's how I plan to make it work.

    <script type="text/javascript" src="http://js.mysite.com/a.js,b.js,c.js"></script>

And if the first line of c.js looks like this:

    //require d.js

Then d.js will be included in the output.

#Planned features

This is *not* ready for use!

 * The actual web service (the core logic is in place, but it is not exposed over HTTP yet)
 * Minification
 * GZip
 * Caching
 * Conditional Get support
