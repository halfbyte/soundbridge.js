#!/usr/bin/ruby

# In case you're wondering what I'm doing with this file here: Flash has
# very strange security measures and this makes testing directly from the
# file system almost impossible. To use this, you have to install mongrel
# and the run >ruby serve.rb
# 


require 'rubygems'
require 'mongrel'

server = Mongrel::HttpServer.new("0.0.0.0", "3000")
server.register("/", Mongrel::DirHandler.new("."))
server.run.join