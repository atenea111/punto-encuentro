require 'json'
require 'xcodeproj'

root = File.expand_path('..', __dir__)
project = Xcodeproj::Project.open(File.join(root, 'ios/App/App.xcodeproj'))
target = project.targets.find { |item| item.name == 'App' }
abort 'No se encontró el target App.' unless target

version = JSON.parse(File.read(File.join(root, 'package.json'))).fetch('version')
build = ENV.fetch('PROJECT_BUILD_NUMBER')
reversed_id = ENV.fetch('GOOGLE_REVERSED_CLIENT_ID')
abort 'PROJECT_BUILD_NUMBER debe ser un entero positivo.' unless build.match?(/\A[1-9][0-9]*\z/)
abort 'La versión debe tener tres componentes numéricos.' unless version.match?(/\A[0-9]+\.[0-9]+\.[0-9]+\z/)

group = project.main_group.find_subpath('App', false)
abort 'No se encontró el grupo App.' unless group
plist_name = 'GoogleService-Info.plist'
plist = group.files.find { |item| item.path == plist_name } || group.new_file(plist_name)
target.resources_build_phase.add_file_reference(plist, true)

target.build_configurations.each do |configuration|
  configuration.build_settings['MARKETING_VERSION'] = version
  configuration.build_settings['CURRENT_PROJECT_VERSION'] = build
  configuration.build_settings['GOOGLE_REVERSED_CLIENT_ID'] = reversed_id
end

project.save
scheme = Xcodeproj::XCScheme.new
scheme.add_build_target(target)
scheme.set_launch_target(target)
scheme.save_as(project.path, 'App', true)
puts "Proyecto iOS preparado. Versión #{version}, build #{build}."
