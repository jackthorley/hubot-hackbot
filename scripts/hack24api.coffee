# Description:
#   Self service team and user administration scripts.
#
# Configuration:
#   HACK24API_URL
#
# Commands:
#   hubot can you see the api? - checks if the API is visible
#   hubot what are your prime directives? - cites hubot's prime directives
#   hubot my id - echos the ID hubot knows you as
#   hubot create team <team name> - tries to create team with name <team name> and adds you to it
#
# Author:
#   codesleuth
#

{Client} = require '../lib/client'
slug = require 'slug'

slugify = (name) -> slug(name, { lower: true })

module.exports = (robot) ->

  robot.hack24client = new Client robot

  robot.respond /can you see the api\??/i, (response) =>
    response.reply "I'll have a quick look for you Sir..."
    robot.hack24client.checkApi()
      .then (res) ->
        if res.ok
          response.reply 'I see her!'
        else
          response.reply "I'm sorry Sir, there appears to be a problem; something about \"#{res.statusCode}\""
      .catch (err) ->
        console.log "API check failed #{err.message}"
        response.reply 'I\'m sorry Sir, there appears to be a big problem!'


  robot.respond /what are your prime directives\??/i, (response) ->
    response.reply "1. Serve the public trust\n2. Protect the innocent hackers\n3. Uphold the Code of Conduct\n4. [Classified]"
    
    
  robot.respond /my id/i, (response) ->
    response.reply "Your id is #{response.message.user.id}"


  robot.respond /create team (.*)/i, (response) ->
    userId = response.message.user.id
    userName = response.message.user.name
    teamName = response.match[1]
    
    robot.hack24client.getUser(userId)
      .then (res) ->
      
        if res.statusCode is 404
          return robot.hack24client.createUser(userId, userName)
            .then (res) ->
              if res.ok
                return robot.hack24client.createTeam(teamName, userId)
                  .then (res) ->
                    if res.ok
                      return response.reply "Welcome to team #{teamName}!"
                      
                    if res.statusCode is 409
                      return response.reply 'Sorry, but that team already exists!'
                      
                    response.reply 'Sorry, I can\'t create your team :frowning:'
                    
              response.reply 'Sorry, I can\'t create your user account :frowning:'
              
        if res.user.team.id isnt undefined
          response.reply "You're already a member of #{res.user.team.name}!"
          return
        
        robot.hack24client.createTeam(teamName, userId)
          .then (res) ->
            if res.ok
              return response.reply "Welcome to team #{teamName}!"
              
            if res.statusCode is 409
              return response.reply "Sorry, but that team already exists!"
                  
            response.reply 'Sorry, I can\'t create your team :frowning:'
            
    .catch (err) ->
        response.reply 'I\'m sorry Sir, there appears to be a big problem!'


  robot.respond /tell me about team (.*)/i, (response) ->
    teamId = slugify(response.match[1])
        
    robot.hack24client.getTeam(teamId)
      .then (res) ->
        if res.statusCode is 404 then return response.reply "Sorry, I can't find that team."
        if !res.ok then return response.reply 'Sorry, there was a problem when I tried to look up that team :frowning:'
          
        if res.team.members.length == 1 and res.team.members[0].id == response.message.user.id
          return response.reply "You are the only member of \"#{res.team.name}\""
          
        memberList = for member in res.team.members
          "#{member.name}"
        
        noun = if res.team.members.length == 1 then 'member' else 'members'

        response.reply "\"#{res.team.name}\" has #{res.team.members.length} #{noun}: #{memberList.join(', ')}" 
      .catch (err) ->
        response.reply 'I\'m sorry Sir, there appears to be a big problem!'


  robot.respond /leave my team/i, (response) ->
    userId = response.message.user.id
  
    robot.hack24client.getUser(userId)
      .then (res) ->
        if !res.ok or res.user.team.id is undefined
          return response.reply 'You\'re not in a team! :goberserk:'

        return robot.hack24client.removeTeamMember(res.user.team.id, userId)
          .then (_res) ->
            response.reply "OK, you've been removed from team \"#{res.user.team.name}\""
        
      .catch (err) ->
        response.reply 'I\'m sorry Sir, there appears to be a big problem!'


  robot.respond /find teams like (.*)/i, (response) ->
    nameFilter = response.match[1]
  
    robot.hack24client.findTeams(nameFilter)
      .then (res) ->
        if res.teams.length == 0
          return response.reply 'None found.'
          
        names = res.teams[..2].map((team) => team.name)
        response.reply "Found #{res.teams.length} teams; here's a few: #{names.join(', ')}"
        
      .catch (err) ->
        response.reply 'I\'m sorry Sir, there appears to be a big problem!'