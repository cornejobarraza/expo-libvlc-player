require "json"

package = JSON.parse(File.read(File.join(__dir__, "..", "package.json")))

Pod::Spec.new do |s|
  s.name             = "ExpoLibVlcPlayer"
  s.version          = package["version"]
  s.swift_version    = "5.9"
  s.author           = package["author"]
  s.license          = package["license"]
  s.homepage         = package["homepage"]
  s.source           = { git: "https://github.com/cornejobarraza/expo-libvlc-player" }
  s.summary          = package["description"]
  s.static_framework = true

  s.ios.deployment_target = "16.4"
  s.tvos.deployment_target = "16.4"

  s.dependency "ExpoModulesCore"
  s.dependency "VLCKit", "4.0.0a26"
  s.pod_target_xcconfig = { "DEFINES_MODULE" => "YES" }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
