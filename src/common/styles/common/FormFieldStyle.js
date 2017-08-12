import * as Colors from '../../../common/constants/Colors'
import { hs, vs } from '../../util'
const FormFieldStyle = {
  container: {
    position: 'relative',
    width: hs(200),
    height: vs(60)
  },
  labelContainer: {
    flex: 1
  },
  errorContainer: {
    flex: 1
  },
  imputContainer: {
    position: 'relative',
    borderBottomColor: Colors.PRIMARY,
    borderBottomWidth: 1,
    flex: 2,
    width: '100%',
    alignItems: 'center'
  },
  labelText: {
    color: Colors.PRIMARY,
    fontSize: 12
  },
  errorText: {
    color: Colors.ACCENT_RED,
    fontSize: 12
  },
  inputStyle: {
    fontSize: 17,
    height: '100%',
    width: '100%',
    color: Colors.GRAY_1
  }
}

export { FormFieldStyle }