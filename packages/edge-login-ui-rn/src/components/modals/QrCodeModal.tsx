import { EdgeAccount, EdgePendingEdgeLogin } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, View } from 'react-native'
import { AirshipBridge } from 'react-native-airship'
import { cacheStyles } from 'react-native-patina'
import { sprintf } from 'sprintf-js'

import { completeLogin } from '../../actions/LoginCompleteActions'
import s from '../../common/locales/strings'
import { Dispatch, Imports, RootState } from '../../types/ReduxTypes'
import { QrCode } from '../common/QrCode'
import { showError } from '../services/AirshipInstance'
import { connect } from '../services/ReduxStore'
import { Theme, ThemeProps, withTheme } from '../services/ThemeContext'
import { ModalCloseArrow } from '../themed/ModalParts'
import { ThemedModal } from '../themed/ThemedModal'
import { MessageText, TitleText } from '../themed/ThemedText'

interface OwnProps {
  bridge: AirshipBridge<void>
}
interface StateProps {}
interface DispatchProps {
  completeLogin: (account: EdgeAccount) => Promise<void>
  getImports: () => Imports
}
type Props = OwnProps & StateProps & DispatchProps & ThemeProps

interface State {
  pendingLogin?: EdgePendingEdgeLogin
  username?: string
}

class QrCodeModalComponent extends React.Component<Props, State> {
  cleanups: Array<() => unknown> = []

  constructor(props: Props) {
    super(props)
    this.state = {}
  }

  componentDidMount() {
    this.prepareLobby().catch(showError)
  }

  componentWillUnmount() {
    for (const cleanup of this.cleanups) cleanup()
    if (this.state.pendingLogin != null) {
      // Close the request, ignoring errors (in case it is alrady closed):
      Promise.resolve(this.state.pendingLogin.cancelRequest()).catch(() => {})
    }
  }

  handleStart = (username: string): void => {
    this.setState({ username })
  }

  handleDone = (account: EdgeAccount): void => {
    const { bridge, completeLogin } = this.props
    completeLogin(account).catch(showError)
    bridge.resolve()
  }

  handleError = (error: unknown): void => {
    const { bridge } = this.props
    showError(error)
    bridge.resolve()
  }

  async prepareLobby() {
    const imports: Imports = this.props.getImports()
    const { accountOptions, context } = imports
    const out: EdgePendingEdgeLogin = await context.requestEdgeLogin({
      ...accountOptions,
      // These are no longer used in recent core versions:
      displayImageUrl:
        'https://github.com/Airbitz/edge-brand-guide/blob/master/Logo/Mark/Edge-Final-Logo_Mark-Green.png',
      displayName: 'Edge Wallet'
    })

    if (out.state != null) {
      // New core versions have the callbacks on the request:
      out.watch('state', state => {
        if (state === 'started' && out.username != null) {
          this.handleStart(out.username)
        }
        if (state === 'done' && out.account != null) {
          this.handleDone(out.account)
        }
        if (state === 'error') this.handleError(out.error)
      })
    } else {
      // Older core versions have the callbacks on the context:
      this.cleanups = [
        // $FlowFixMe
        context.on('login', account => this.handleDone(account)),
        // $FlowFixMe
        context.on('loginStart', ({ username }) => this.handleStart(username)),
        // $FlowFixMe
        context.on('loginError', ({ error }) => this.handleError(error))
      ]
    }

    this.setState({ pendingLogin: out })
  }

  render() {
    const { bridge, theme } = this.props
    const { pendingLogin, username } = this.state
    const styles = getStyles(theme)

    return (
      <ThemedModal bridge={bridge} onCancel={() => bridge.resolve()}>
        <TitleText>{s.strings.qr_modal_title}</TitleText>
        <MessageText>
          {username != null
            ? sprintf(s.strings.qr_modal_started, username)
            : s.strings.qr_modal_message}
        </MessageText>
        <View style={styles.qrContainer}>
          {username != null || pendingLogin == null ? (
            <ActivityIndicator color={theme.primaryText} />
          ) : (
            <QrCode
              data={'edge://edge/' + pendingLogin.id}
              size={theme.rem(14)}
            />
          )}
        </View>
        <ModalCloseArrow onPress={() => bridge.resolve()} />
      </ThemedModal>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  qrContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: theme.rem(16),
    padding: theme.rem(1)
  }
}))

export const QrCodeModal = connect<StateProps, DispatchProps, OwnProps>(
  (state: RootState) => ({}),
  (dispatch: Dispatch) => ({
    async completeLogin(account) {
      return await dispatch(completeLogin(account))
    },
    getImports() {
      return dispatch((dispatch, getState, imports) => imports)
    }
  })
)(withTheme(QrCodeModalComponent))
