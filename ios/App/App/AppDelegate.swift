import UIKit
import Capacitor
import FirebaseCore
import FirebaseMessaging
import GoogleSignIn

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate, MessagingDelegate {
    var window: UIWindow?
    private var apnsRegistered = false

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Sin este recurso, la app abre pero las notificaciones quedan deshabilitadas.
        if Bundle.main.url(forResource: "GoogleService-Info", withExtension: "plist") != nil {
            FirebaseApp.configure()
            Messaging.messaging().delegate = self
        }
        return true
    }

    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        guard FirebaseApp.app() != nil else {
            reportPushError(NSError(domain: "PuntoEncuentro.Push", code: 1, userInfo: [
                NSLocalizedDescriptionKey: "Agregá GoogleService-Info.plist al target App. Ver GUIA_IOS.md."
            ]))
            return
        }

        apnsRegistered = true
        Messaging.messaging().apnsToken = deviceToken
        Messaging.messaging().isAutoInitEnabled = true
        // El backend envía por FCM: nunca publicar el token APNs como fcmToken.
        Messaging.messaging().token { [weak self] token, error in
            if let error = error {
                self?.reportPushError(error)
            } else if let token = token {
                self?.publishFCMToken(token)
            }
        }
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        reportPushError(error)
    }

    func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
        guard apnsRegistered, let token = fcmToken else { return }
        publishFCMToken(token)
    }

    private func publishFCMToken(_ token: String) {
        DispatchQueue.main.async {
            NotificationCenter.default.post(name: .capacitorDidRegisterForRemoteNotifications, object: token)
        }
    }

    private func reportPushError(_ error: Error) {
        DispatchQueue.main.async {
            NotificationCenter.default.post(name: .capacitorDidFailToRegisterForRemoteNotifications, object: error)
        }
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        if GIDSignIn.sharedInstance.handle(url) { return true }
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }
}
